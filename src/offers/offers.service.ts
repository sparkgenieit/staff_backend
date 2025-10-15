// src/offers/offers.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OfferStatus, ShiftStatus } from '@prisma/client';

function toBigIntId(id: string | number | bigint): bigint {
  try {
    return BigInt(String(id));
  } catch {
    throw new BadRequestException('Invalid id format');
  }
}

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
    const workOrderId = toBigIntId(body?.workOrderId);
    const workerIdsInput = Array.isArray(body?.workerIds) ? body.workerIds : [];
    const workerIds: bigint[] = workerIdsInput.map((x: any) => toBigIntId(x));
    const expiresInMinutes = Number(body?.expiresInMinutes ?? 60);

    if (!workerIds.length) {
      throw new BadRequestException('workerIds required');
    }

    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });
    if (!wo) throw new NotFoundException('Work order not found');

    // Validate workers
    const existingWorkers = await this.prisma.worker.findMany({
      where: { id: { in: workerIds } },
      select: { id: true },
    });
    const valid = new Set(existingWorkers.map((w) => w.id.toString()));
    const toCreate = workerIds.filter((id) => valid.has(id.toString()));

    if (toCreate.length === 0) {
      throw new BadRequestException('No valid workerIds to send offers');
    }

    // Avoid duplicates for the same (workOrderId, workerId)
    const already = await this.prisma.offer.findMany({
      where: { workOrderId, workerId: { in: toCreate } },
      select: { workerId: true },
    });
    const existing = new Set(already.map((o) => o.workerId.toString()));
    const createIds = toCreate.filter((id) => !existing.has(id.toString()));

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

  async accept(id: string | number | bigint) {
    const oid = toBigIntId(id);

    return this.prisma.$transaction(async (tx) => {
      // fetch the offer together with the work order (needed to build a shift window)
      const offer = await tx.offer.findUnique({
        where: { id: oid },
        include: { workOrder: true },
      });
      if (!offer) throw new NotFoundException('Offer not found');
      if (offer.status !== OfferStatus.SENT) {
        throw new BadRequestException('Offer is not in SENT status');
      }

      // 1) mark offer as ACCEPTED
      await tx.offer.update({
        where: { id: oid },
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
        const end = new Date(
          start.getTime() + Number(offer.workOrder.durationMins) * 60 * 1000,
        );

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
        where: { id: oid },
        include: { workOrder: true, worker: true },
      });
    });
  }

  async reject(id: string | number | bigint) {
    const oid = toBigIntId(id);
    // If already accepted/rejected, this simply updates status to REJECTED
    return this.prisma.offer.update({
      where: { id: oid },
      data: { status: OfferStatus.REJECTED },
    });
  }

  async remove(id: string | number | bigint) {
    const oid = toBigIntId(id);
    return this.prisma.offer.delete({ where: { id: oid } });
  }

  /**
   * Worker-scoped: list offers for the logged-in user (via linked Worker).
   * Safe for staff app; does not affect admin endpoints.
   */
  async listForLoggedInWorker(userId: string | number | bigint) {
    const uid = toBigIntId(userId);

    const worker = await this.prisma.worker.findFirst({
      where: { userId: uid },
      select: { id: true },
    });
    if (!worker) return [];

    return this.prisma.offer.findMany({
      where: { workerId: worker.id },
      orderBy: { id: 'desc' },
      include: {
        workOrder: {
          include: {
            site: true, // useful for UI cards
          },
        },
      },
    });
  }

  /**
   * Worker-scoped: accept an offer that belongs to the logged-in user.
   * Reuses the existing admin `accept()` logic after ownership check.
   */
  async acceptForLoggedInWorker(
    offerId: string | number | bigint,
    userId: string | number | bigint,
  ) {
    const uid = toBigIntId(userId);

    const worker = await this.prisma.worker.findFirst({
      where: { userId: uid },
      select: { id: true },
    });
    if (!worker) {
      throw new BadRequestException('Worker profile not found for this user');
    }

    const offer = await this.prisma.offer.findUnique({
      where: { id: toBigIntId(offerId) },
      select: { id: true, workerId: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.workerId !== worker.id) {
      throw new BadRequestException('Not your offer');
    }

    // Delegate to existing flow (creates assignment/shift etc.)
    return this.accept(offer.id);
  }

  /**
   * Worker-scoped: reject an offer that belongs to the logged-in user.
   * Reuses the existing admin `reject()` logic after ownership check.
   */
  async rejectForLoggedInWorker(
    offerId: string | number | bigint,
    userId: string | number | bigint,
  ) {
    const uid = toBigIntId(userId);

    const worker = await this.prisma.worker.findFirst({
      where: { userId: uid },
      select: { id: true },
    });
    if (!worker) {
      throw new BadRequestException('Worker profile not found for this user');
    }

    const offer = await this.prisma.offer.findUnique({
      where: { id: toBigIntId(offerId) },
      select: { id: true, workerId: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.workerId !== worker.id) {
      throw new BadRequestException('Not your offer');
    }

    return this.reject(offer.id);
  }
}
