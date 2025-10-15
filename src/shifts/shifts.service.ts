import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ShiftStatus } from '@prisma/client';

function toBigIntId(id: string | number | bigint): bigint {
  try {
    return BigInt(String(id));
  } catch {
    throw new BadRequestException('Invalid id format');
  }
}

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  async list() {
    // Keep it simple; the UI only needs shift fields and assignmentId
    return this.prisma.shift.findMany({
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Mark a shift as started (IN_PROGRESS), set startActual, and create/update Attendance with inLat/inLng.
   */
  async checkIn(shiftId: string | number | bigint, lat?: number, lng?: number) {
    const sid = toBigIntId(shiftId);

    const shift = await this.prisma.shift.findUnique({ where: { id: sid } });
    if (!shift) throw new NotFoundException('Shift not found');

    // If already started, just return current record
    if (shift.status === ShiftStatus.IN_PROGRESS || shift.startActual) {
      if (lat != null && lng != null) {
        await this.ensureAttendanceIn(sid, lat, lng);
      }
      return this.prisma.shift.findUnique({ where: { id: sid } });
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.shift.update({
        where: { id: sid },
        data: {
          status: ShiftStatus.IN_PROGRESS,
          startActual: now,
        },
      });

      await this.ensureAttendanceInWithTx(tx, sid, lat, lng);

      return updated;
    });
  }

  /**
   * Mark a shift as completed, set endActual, and update Attendance with outLat/outLng.
   */
  async checkOut(
    shiftId: string | number | bigint,
    lat?: number,
    lng?: number,
  ) {
    const sid = toBigIntId(shiftId);

    const shift = await this.prisma.shift.findUnique({ where: { id: sid } });
    if (!shift) throw new NotFoundException('Shift not found');

    // If already completed, just patch attendance out coords if provided
    if (shift.status === ShiftStatus.COMPLETED && shift.endActual) {
      if (lat != null && lng != null) {
        await this.patchAttendanceOut(sid, lat, lng);
      }
      return this.prisma.shift.findUnique({ where: { id: sid } });
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.shift.update({
        where: { id: sid },
        data: {
          status: ShiftStatus.COMPLETED,
          endActual: now,
        },
      });

      await this.patchAttendanceOutWithTx(tx, sid, lat, lng);

      return updated;
    });
  }

  // ---- helpers ----

  private async ensureAttendanceIn(
    shiftId: bigint,
    lat?: number,
    lng?: number,
  ) {
    const att = await this.prisma.attendance.findUnique({ where: { shiftId } });
    if (!att) {
      await this.prisma.attendance.create({
        data: {
          shiftId,
          inLat: lat != null ? String(lat) : null,
          inLng: lng != null ? String(lng) : null,
        },
      });
    } else if (
      lat != null &&
      lng != null &&
      (att.inLat == null || att.inLng == null)
    ) {
      await this.prisma.attendance.update({
        where: { shiftId },
        data: {
          inLat: String(lat),
          inLng: String(lng),
        },
      });
    }
  }

  private async ensureAttendanceInWithTx(
    tx: Parameters<PrismaService['$transaction']>[0] extends infer _T ? any : never,
    shiftId: bigint,
    lat?: number,
    lng?: number,
  ) {
    const att = await tx.attendance.findUnique({ where: { shiftId } });
    if (!att) {
      await tx.attendance.create({
        data: {
          shiftId,
          inLat: lat != null ? String(lat) : null,
          inLng: lng != null ? String(lng) : null,
        },
      });
    } else if (
      lat != null &&
      lng != null &&
      (att.inLat == null || att.inLng == null)
    ) {
      await tx.attendance.update({
        where: { shiftId },
        data: {
          inLat: String(lat),
          inLng: String(lng),
        },
      });
    }
  }

  private async patchAttendanceOut(
    shiftId: bigint,
    lat?: number,
    lng?: number,
  ) {
    const att = await this.prisma.attendance.findUnique({ where: { shiftId } });
    if (!att) {
      await this.prisma.attendance.create({
        data: {
          shiftId,
          outLat: lat != null ? String(lat) : null,
          outLng: lng != null ? String(lng) : null,
        },
      });
    } else if (lat != null && lng != null) {
      await this.prisma.attendance.update({
        where: { shiftId },
        data: {
          outLat: String(lat),
          outLng: String(lng),
        },
      });
    }
  }

  private async patchAttendanceOutWithTx(
    tx: Parameters<PrismaService['$transaction']>[0] extends infer _T ? any : never,
    shiftId: bigint,
    lat?: number,
    lng?: number,
  ) {
    const att = await tx.attendance.findUnique({ where: { shiftId } });
    if (!att) {
      await tx.attendance.create({
        data: {
          shiftId,
          outLat: lat != null ? String(lat) : null,
          outLng: lng != null ? String(lng) : null,
        },
      });
    } else if (lat != null && lng != null) {
      await tx.attendance.update({
        where: { shiftId },
        data: {
          outLat: String(lat),
          outLng: String(lng),
        },
      });
    }
  }

  /**
   * Worker-scoped list. Coerce id safely; attach `site` from `assignment.workOrder.site`
   * so the frontend can continue to use `shift.site?.name`.
   */
  async listForLoggedInWorker(userId: string | number | bigint) {
    const uid = toBigIntId(userId);

    const worker = await this.prisma.worker.findFirst({
      where: { userId: uid },
      select: { id: true },
    });
    if (!worker) return [];

    const shifts = await this.prisma.shift.findMany({
      where: { assignment: { workerId: worker.id } },
      orderBy: { startPlanned: 'asc' },
      include: {
        assignment: {
          include: {
            workOrder: {
              include: {
                site: true, // <-- get site via workOrder
              },
            },
          },
        },
        attendance: true,
        // NOTE: do not include `site: true` here; Shift has no direct `site` relation
      },
    });

    // Attach a top-level `site` so UI can keep using `shift.site?.name`
    const withSite = shifts.map((s: any) => ({
      ...s,
      site: s?.assignment?.workOrder?.site ?? null,
    }));

    // Optionally strip the heavy nesting if you want a leaner payload:
    // return withSite.map(({ assignment, ...rest }) => rest);

    return withSite;
  }
}
