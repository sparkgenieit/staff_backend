import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ShiftStatus } from '@prisma/client';

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
  async checkIn(shiftId: number, lat?: number, lng?: number) {
    if (!Number.isFinite(shiftId)) {
      throw new BadRequestException('Invalid shift id');
    }

    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Shift not found');

    // If already started, just return current record
    if (shift.status === ShiftStatus.IN_PROGRESS || shift.startActual) {
      // Ensure attendance has inbound coords if provided
      if (lat != null && lng != null) {
        await this.ensureAttendanceIn(shiftId, lat, lng);
      }
      return this.prisma.shift.findUnique({ where: { id: shiftId } });
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.shift.update({
        where: { id: shiftId },
        data: {
          status: ShiftStatus.IN_PROGRESS,
          startActual: now,
        },
      });

      await this.ensureAttendanceInWithTx(tx, shiftId, lat, lng);

      return updated;
    });
  }

  /**
   * Mark a shift as completed, set endActual, and update Attendance with outLat/outLng.
   * If the shift was never checked in, we’ll still allow completion (sets IN_PROGRESS -> COMPLETED).
   */
  async checkOut(shiftId: number, lat?: number, lng?: number) {
    if (!Number.isFinite(shiftId)) {
      throw new BadRequestException('Invalid shift id');
    }

    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Shift not found');

    // If already completed, just patch attendance out coords if provided
    if (shift.status === ShiftStatus.COMPLETED && shift.endActual) {
      if (lat != null && lng != null) {
        await this.patchAttendanceOut(shiftId, lat, lng);
      }
      return this.prisma.shift.findUnique({ where: { id: shiftId } });
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.shift.update({
        where: { id: shiftId },
        data: {
          status: ShiftStatus.COMPLETED,
          endActual: now,
          // If someone tries to complete directly from PLANNED, we still allow it
          // and keep/leave startActual as-is.
        },
      });

      await this.patchAttendanceOutWithTx(tx, shiftId, lat, lng);

      return updated;
    });
  }

  // ---- helpers ----

  private async ensureAttendanceIn(shiftId: number, lat?: number, lng?: number) {
    const att = await this.prisma.attendance.findUnique({ where: { shiftId } });
    if (!att) {
      await this.prisma.attendance.create({
        data: {
          shiftId,
          inLat: lat != null ? String(lat) : null,
          inLng: lng != null ? String(lng) : null,
        },
      });
    } else if (lat != null && lng != null && (att.inLat == null || att.inLng == null)) {
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
    tx: PrismaService['$transaction'] extends (...args: any) => infer R ? any : never,
    shiftId: number,
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
    } else if (lat != null && lng != null && (att.inLat == null || att.inLng == null)) {
      await tx.attendance.update({
        where: { shiftId },
        data: {
          inLat: String(lat),
          inLng: String(lng),
        },
      });
    }
  }

  private async patchAttendanceOut(shiftId: number, lat?: number, lng?: number) {
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
    tx: PrismaService['$transaction'] extends (...args: any) => infer R ? any : never,
    shiftId: number,
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
}
