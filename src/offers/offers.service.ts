import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OfferStatus,ShiftStatus, Prisma } from '@prisma/client';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.offer.findMany({
      orderBy: { id: 'desc' },
    });
  }

  /**
   * body: { workOrderId:number; workerIds:number[]; expiresInMinutes?:number }
   */
  async send(body: any) {
    const workOrderId = Number(body?.workOrderId);
    const workerIds = (Array.isArray(body?.workerIds) ? body.workerIds : []).map((x: any) =>
      Number(x),
    );
    const expiresInMinutes = Number(body?.expiresInMinutes ?? 60);

    if (!Number.isFinite(workOrderId)) {
      throw new BadRequestException('workOrderId required');
    }
    if (!workerIds.length) {
      throw new BadRequestException('workerIds required');
    }

    const wo = await this.prisma.workOrder.findUnique({ where: { id: workOrderId } });
    if (!wo) throw new NotFoundException('Work order not found');

    // Validate workers
    const existingWorkers = await this.prisma.worker.findMany({
      where: { id: { in: workerIds } },
      select: { id: true },
    });
    const validIds = new Set(existingWorkers.map((w) => Number(w.id)));
    const toCreate = workerIds.filter((id) => validIds.has(id));

    if (toCreate.length === 0) {
      throw new BadRequestException('No valid workerIds to send offers');
    }

    // Avoid duplicates for the same (workOrderId, workerId)
    const already = await this.prisma.offer.findMany({
      where: { workOrderId, workerId: { in: toCreate } },
      select: { workerId: true },
    });
    const existing = new Set(already.map((o) => Number(o.workerId)));
    const createIds = toCreate.filter((id) => !existing.has(id));

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    if (!createIds.length) {
      return { created: 0, skipped: toCreate.length };
    }

    const created = await this.prisma.$transaction(
      createIds.map((workerId) =>
        this.prisma.offer.create({
          data: {
            workOrderId,
            workerId,
            status: OfferStatus.SENT,
            expiresAt,
          },
        }),
      ),
    );

    return { created: created.length, skipped: toCreate.length - created.length };
  }

  async accept(id: number) {
  return this.prisma.$transaction(async (tx) => {
    // fetch the offer together with the work order (needed to build a shift window)
    const offer = await tx.offer.findUnique({
      where: { id },
      include: { workOrder: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.status !== OfferStatus.SENT) {
      throw new BadRequestException('Offer is not in SENT status');
    }

    // 1) mark offer as ACCEPTED
    await tx.offer.update({
      where: { id },
      data: { status: OfferStatus.ACCEPTED },
    });

    // 2) ensure exactly one assignment exists for (workOrderId, workerId)
    let assignment = await tx.assignment.findFirst({
      where: { workOrderId: offer.workOrderId, workerId: offer.workerId },
    });
    if (!assignment) {
      assignment = await tx.assignment.create({
        data: {
          workOrderId: offer.workOrderId,
          workerId: offer.workerId,
          final: true,
        },
      });
    }

    // 3) ensure at least one PLANNED shift exists for that assignment
    const existingShift = await tx.shift.findFirst({
      where: { assignmentId: assignment.id },
    });
    if (!existingShift) {
      // derive shift times from work order
      const start = new Date(offer.workOrder.start);
      const end = new Date(start.getTime() + Number(offer.workOrder.durationMins) * 60 * 1000);

      await tx.shift.create({
        data: {
          assignmentId: assignment.id,
          startPlanned: start,
          endPlanned: end,
          status: ShiftStatus.PLANNED,
        },
      });
    }

    // return the accepted offer (optionally include relations)
    return tx.offer.findUnique({
      where: { id },
      include: { workOrder: true, worker: true },
    });
  });
}

  async reject(id: number) {
    // If already accepted/rejected, this simply updates status to REJECTED
    return this.prisma.offer.update({
      where: { id },
      data: { status: OfferStatus.REJECTED },
    });
  }

  async remove(id: number) {
    return this.prisma.offer.delete({ where: { id } });
  }

   /**
   * Worker-scoped: list offers for the logged-in user (via linked Worker).
   * Safe for staff app; does not affect admin endpoints.
   */
  async listForLoggedInWorker(userId: bigint | number) {
    const worker = await this.prisma.worker.findFirst({
      where: { userId: BigInt(userId) },
      select: { id: true },
    });
    if (!worker) return [];
    return this.prisma.offer.findMany({
      where: { workerId: worker.id },
      orderBy: { id: 'desc' },
      include: {
        workOrder: true, // handy for UI
      },
    });
  }

  /**
   * Worker-scoped: accept an offer that belongs to the logged-in user.
   * Reuses the existing admin `accept()` logic after ownership check.
   */
  async acceptForLoggedInWorker(offerId: bigint | number, userId: bigint | number) {
    const worker = await this.prisma.worker.findFirst({
      where: { userId: BigInt(userId) },
      select: { id: true },
    });
    if (!worker) {
      throw new BadRequestException('Worker profile not found for this user');
    }

    const offer = await this.prisma.offer.findUnique({
      where: { id: Number(offerId) },
      select: { id: true, workerId: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (Number(offer.workerId) !== Number(worker.id)) {
      throw new BadRequestException('Not your offer');
    }

    // Delegate to existing flow (creates assignment/shift etc.)
    return this.accept(Number(offerId));
  }

  /**
   * Worker-scoped: reject an offer that belongs to the logged-in user.
   * Reuses the existing admin `reject()` logic after ownership check.
   */
  async rejectForLoggedInWorker(offerId: bigint | number, userId: bigint | number) {
    const worker = await this.prisma.worker.findFirst({
      where: { userId: BigInt(userId) },
      select: { id: true },
    });
    if (!worker) {
      throw new BadRequestException('Worker profile not found for this user');
    }

    const offer = await this.prisma.offer.findUnique({
      where: { id: Number(offerId) },
      select: { id: true, workerId: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (Number(offer.workerId) !== Number(worker.id)) {
      throw new BadRequestException('Not your offer');
    }

    return this.reject(Number(offerId));
  }
}
