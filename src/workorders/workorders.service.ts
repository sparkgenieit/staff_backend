import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WorkordersService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.workOrder.findMany();
  }

  open() {
    return this.prisma.workOrder.findMany({
      where: { status: { in: ['OPEN', 'PARTIAL'] } },
    });
  }

  async create(body: any) {
    const data = await this.sanitizeAndValidate(body);
    return this.prisma.workOrder.create({ data });
  }

  async update(id: number, body: any) {
    const data = await this.sanitizeAndValidate(body, /*isUpdate*/ true);
    try {
      return await this.prisma.workOrder.update({
        where: { id: Number(id) },
        data,
      });
    } catch (err: any) {
      // Prisma P2003 = FK constraint failed
      if (err?.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint violated (siteId/orgId).');
      }
      throw err;
    }
  }

  async remove(id: number) {
    return this.prisma.workOrder.delete({ where: { id: Number(id) } });
  }

  /** Mark a work order as FILLED (for PATCH /work-orders/:id/filled). */
  async filled(id: number) {
    return this.prisma.workOrder.update({
      where: { id: Number(id) },
      data: { status: 'FILLED' },
    });
  }

  /** Duplicate a work order (for POST /work-orders/:id/duplicate). */
  async duplicate(id: number) {
    const src = await this.prisma.workOrder.findUnique({
      where: { id: Number(id) },
    });
    if (!src) {
      throw new NotFoundException('Work order not found');
    }

    // Omit PK and audit fields if present
    const {
      id: _omitId,
      createdAt: _omitCreatedAt,
      updatedAt: _omitUpdatedAt,
      ...rest
    } = src as any;

    // Create a copy; default status to DRAFT
    return this.prisma.workOrder.create({
      data: {
        ...rest,
        status: 'DRAFT',
      } as Prisma.WorkOrderUncheckedCreateInput,
    });
  }

  /**
   * Coerce/clean incoming body:
   * - orgId: number
   * - siteId: number | null (set null if not provided/invalid)
   * - start: Date
   * - roleName/status: as-is (trusted from frontend enum)
   * - durationMins/headcount/budget: number
   * Also verifies that site exists (if provided) and (optionally) belongs to org.
   */
  private async sanitizeAndValidate(body: any, isUpdate = false): Promise<Prisma.WorkOrderUncheckedCreateInput> {
    const {
      orgId,
      siteId,
      start,
      roleName,
      durationMins,
      headcount,
      budget,
      recurringRule,
      status,
      ...rest
    } = body ?? {};

    const data: any = { ...rest };

    // orgId
    if (orgId !== undefined) {
      const orgNum = Number(orgId);
      if (!Number.isFinite(orgNum) || orgNum <= 0) throw new BadRequestException('Invalid orgId');
      data.orgId = orgNum;
    } else if (!isUpdate) {
      throw new BadRequestException('orgId is required');
    }

    // siteId -> number or null
    if (siteId === undefined || siteId === null || siteId === '' || siteId === 'none') {
      data.siteId = null;
    } else {
      const sid = Number(siteId);
      if (Number.isFinite(sid) && sid > 0) {
        // verify site exists
        const site = await this.prisma.site.findUnique({ where: { id: sid } });
        if (!site) throw new BadRequestException('siteId does not exist');
        // (optional) verify site belongs to orgId when both present
        if (data.orgId !== undefined && site.orgId !== data.orgId) {
          throw new BadRequestException('siteId does not belong to the given orgId');
        }
        data.siteId = sid;
      } else {
        data.siteId = null;
      }
    }

    // start -> Date
    if (start !== undefined) {
      const iso = String(start);
      const d = new Date(iso);
      if (isNaN(d.getTime())) throw new BadRequestException('Invalid start datetime');
      data.start = d;
    } else if (!isUpdate) {
      throw new BadRequestException('start is required');
    }

    // numbers
    if (durationMins !== undefined) {
      const n = Number(durationMins);
      if (!Number.isFinite(n) || n < 30) throw new BadRequestException('durationMins must be >= 30');
      data.durationMins = n;
    }
    if (headcount !== undefined) {
      const n = Number(headcount);
      if (!Number.isFinite(n) || n < 1) throw new BadRequestException('headcount must be >= 1');
      data.headcount = n;
    }
    if (budget !== undefined) {
      const n = Number(budget);
      if (!Number.isFinite(n) || n < 0) throw new BadRequestException('budget must be >= 0');
      data.budget = n;
    }

    // strings/enums
    if (roleName !== undefined) data.roleName = String(roleName);
    if (recurringRule !== undefined) data.recurringRule = String(recurringRule);
    if (status !== undefined) data.status = String(status);

    return data as Prisma.WorkOrderUncheckedCreateInput;
  }
}
