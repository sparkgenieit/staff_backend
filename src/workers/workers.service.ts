import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// normalize Decimal-ish values to string (e.g. 4 -> "4.00")
const toRateString = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '0.00';
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : v;
  }
  if (typeof v === 'number' && Number.isFinite(v)) return v.toFixed(2);
  const n = Number(v as any);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
};

type RoleName = 'maid' | 'driver' | 'telecaller' | 'carpenter';

type CreateWorkerInput = {
  name: string;
  phone: string;
  baseRate: string | number;
  rateUnit: 'HOUR' | 'DAY' | 'FIXED';
  radiusKm: number;
  expYears?: number;
  rating?: number | string;
  strikes?: number;

  // NEW: arrays to persist into WorkerSkill / WorkerLanguage
  skills?: RoleName[];
  langs?: string[];
};

type UpdateWorkerInput = Partial<CreateWorkerInput>;

@Injectable()
export class WorkersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateWorkerInput) {
    const phone = (data.phone || '').replace(/\s+/g, '');
    if (!phone) throw new BadRequestException('Phone is required');
    if (!data.name) throw new BadRequestException('Name is required');

    return this.prisma.$transaction(async (tx) => {
      // 1) Find or create User with this phone
      const existingUser = await tx.user.findUnique({
        where: { phone },
        include: { worker: { select: { id: true } } },
      });

      let userId: bigint;
      if (existingUser) {
        if (existingUser.worker?.id) {
          throw new ConflictException('A worker is already linked to this phone');
        }
        userId = existingUser.id;
        if (existingUser.role !== 'STAFF' || !existingUser.isActive || !existingUser.name) {
          await tx.user.update({
            where: { id: userId },
            data: { role: 'STAFF', isActive: true, name: existingUser.name || data.name },
          });
        }
      } else {
        const created = await tx.user.create({
          data: { phone, name: data.name, role: 'STAFF', isActive: true },
          select: { id: true },
        });
        userId = created.id;
      }

      // 2) Create Worker linked to that user (also persist rating/strikes)
      const worker = await tx.worker.create({
        data: {
          name: data.name,
          phone,
          baseRate: toRateString(data.baseRate) as any,
          rateUnit: data.rateUnit,
          radiusKm: data.radiusKm,
          expYears: data.expYears ?? 0,
          rating: toRateString(data.rating ?? 0), // "4.00" etc.
          strikes: data.strikes ?? 0,
          userId,
        },
      });

      // 3) Persist skills/langs if provided
      if (data.skills?.length) {
        await tx.workerSkill.createMany({
          data: data.skills.map((role) => ({ workerId: worker.id, role })),
          skipDuplicates: true,
        });
      }

      if (data.langs?.length) {
        await tx.workerLanguage.createMany({
          data: data.langs.map((lang) => ({ workerId: worker.id, lang })),
          skipDuplicates: true,
        });
      }

      // Return worker with related info
      const full = await tx.worker.findUnique({
        where: { id: worker.id },
        include: {
          user: { select: { id: true, phone: true, role: true, name: true } },
          skills: true,
          langs: true,
        },
      });

      return full!;
    });
  }

  async findAll() {
    return this.prisma.worker.findMany({
      include: {
        user: { select: { id: true, phone: true, role: true, name: true } },
        skills: true,
        langs: true,
      },
    });
  }

  async findOne(id: bigint) {
    const worker = await this.prisma.worker.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, phone: true, role: true, name: true } },
        skills: true,
        langs: true,
      },
    });
    if (!worker) throw new NotFoundException('Worker not found');
    return worker;
  }

  async update(id: bigint, data: UpdateWorkerInput) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.worker.findUnique({
        where: { id },
        include: { user: true },
      });
      if (!current) throw new NotFoundException('Worker not found');

      // Sync phone to User if changed
      let nextPhone = data.phone?.replace(/\s+/g, '');
      if (typeof nextPhone === 'string' && nextPhone !== current.phone) {
        const owner = await tx.user.findUnique({ where: { phone: nextPhone } });
        if (owner && (!current.user || owner.id !== current.user.id)) {
          throw new ConflictException('Another user already has this phone');
        }
        if (current.userId) {
          await tx.user.update({ where: { id: current.userId }, data: { phone: nextPhone } });
        } else {
          const createdUser = await tx.user.create({
            data: { phone: nextPhone, name: data.name ?? current.name, role: 'STAFF', isActive: true },
            select: { id: true },
          });
          await tx.worker.update({ where: { id }, data: { userId: createdUser.id } });
        }
      }

      // Update core fields
      await tx.worker.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(nextPhone !== undefined ? { phone: nextPhone } : {}),
          ...(data.baseRate !== undefined ? { baseRate: toRateString(data.baseRate) as any } : {}),
          ...(data.rateUnit !== undefined ? { rateUnit: data.rateUnit } : {}),
          ...(data.radiusKm !== undefined ? { radiusKm: data.radiusKm } : {}),
          ...(data.expYears !== undefined ? { expYears: data.expYears } : {}),
          ...(data.rating !== undefined ? { rating: toRateString(data.rating) as any } : {}),
          ...(data.strikes !== undefined ? { strikes: data.strikes } : {}),
        },
      });

      // Replace skills if explicitly provided
      if (Object.prototype.hasOwnProperty.call(data, 'skills')) {
        await tx.workerSkill.deleteMany({ where: { workerId: id } });
        if (data.skills?.length) {
          await tx.workerSkill.createMany({
            data: data.skills.map((role) => ({ workerId: id, role })),
            skipDuplicates: true,
          });
        }
      }

      // Replace langs if explicitly provided
      if (Object.prototype.hasOwnProperty.call(data, 'langs')) {
        await tx.workerLanguage.deleteMany({ where: { workerId: id } });
        if (data.langs?.length) {
          await tx.workerLanguage.createMany({
            data: data.langs.map((lang) => ({ workerId: id, lang })),
            skipDuplicates: true,
          });
        }
      }

      const full = await tx.worker.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, phone: true, role: true, name: true } },
          skills: true,
          langs: true,
        },
      });

      return full!;
    });
  }

  async remove(id: bigint) {
    return this.prisma.worker.delete({ where: { id } });
  }
}