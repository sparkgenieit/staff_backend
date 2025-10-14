import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const toMoneyString = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '0.00';
  if (typeof v === 'number' && Number.isFinite(v)) return v.toFixed(2);
  const n = Number(v as any);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
};

type RoleName = 'maid' | 'driver' | 'telecaller' | 'carpenter';

type WorkOrderStatus = 'DRAFT' | 'OPEN' | 'FILLED' | 'PARTIAL' | 'CANCELLED' | 'COMPLETED';

type CreateInput = {
  orgId: number;
  siteId?: number;
  roleName: 'maid'|'driver'|'telecaller'|'carpenter';
  headcount: number;
  start: string | Date;
  durationMins: number;
  recurringRule?: string;
  budget: string | number;
  status?: WorkOrderStatus; // NEW
};

type UpdateInput = Partial<CreateInput>;

@Injectable()
export class WorkordersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a work order. If siteId is provided, we align orgId to the site's org.
   * This avoids "siteId does not belong to the given orgId" errors in the UI.
   */
  async create(data: CreateInput) {
    let orgId = Number(data.orgId);
    let siteId = data.siteId ? Number(data.siteId) : undefined;

    if (!orgId && !siteId) {
      throw new BadRequestException('orgId is required when siteId is not provided');
    }

    if (siteId) {
      const site = await this.prisma.site.findUnique({
        where: { id: BigInt(siteId) },
        select: { id: true, orgId: true },
      });
      if (!site) throw new NotFoundException('siteId not found');
      // auto-align org to the site's org
      orgId = Number(site.orgId);
    }

    const created = await this.prisma.workOrder.create({
      data: {
        orgId: BigInt(orgId),
        siteId: siteId ? BigInt(siteId) : undefined,
        roleName: data.roleName,
        headcount: data.headcount,
        start: new Date(data.start),
        durationMins: data.durationMins,
        recurringRule: data.recurringRule ?? null,
        budget: toMoneyString(data.budget) as any,
        ...(data.status ? { status: data.status } : {}),
      },
    });
    return created;
  }

  async findAll() {
    return this.prisma.workOrder.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: bigint) {
    const record = await this.prisma.workOrder.findUnique({
      where: { id },
    });
    if (!record) throw new NotFoundException('Work order not found');
    return record;
  }

  /**
   * Update a work order. If siteId is changed/present, align orgId to the site's org.
   * If siteId is removed (set undefined), keep existing orgId unless caller sends a new orgId.
   */
  async update(id: bigint, data: UpdateInput) {
    const existing = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Work order not found');

    let nextOrgId: number | undefined =
      data.orgId !== undefined ? Number(data.orgId) : Number(existing.orgId);
    let nextSiteId: number | undefined =
      data.siteId !== undefined ? (data.siteId === null ? undefined : Number(data.siteId)) : (existing.siteId ? Number(existing.siteId) : undefined);

    // If a site is (still) present, prefer aligning orgId to site's org
    if (nextSiteId) {
      const site = await this.prisma.site.findUnique({
        where: { id: BigInt(nextSiteId) },
        select: { id: true, orgId: true },
      });
      if (!site) throw new NotFoundException('siteId not found');
      nextOrgId = Number(site.orgId);
    } else if (!nextOrgId) {
      throw new BadRequestException('orgId is required when siteId is not provided');
    }

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: {
        orgId: BigInt(nextOrgId!),
        siteId: nextSiteId ? BigInt(nextSiteId) : null,
        ...(data.roleName !== undefined ? { roleName: data.roleName } : {}),
        ...(data.headcount !== undefined ? { headcount: data.headcount } : {}),
        ...(data.start !== undefined ? { start: new Date(data.start) } : {}),
        ...(data.durationMins !== undefined ? { durationMins: data.durationMins } : {}),
        ...(data.recurringRule !== undefined ? { recurringRule: data.recurringRule ?? null } : {}),
        ...(data.budget !== undefined ? { budget: toMoneyString(data.budget) as any } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
    return updated;
  }

  async remove(id: bigint) {
    return this.prisma.workOrder.delete({ where: { id } });
  }
}