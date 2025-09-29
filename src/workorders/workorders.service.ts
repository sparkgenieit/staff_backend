import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
@Injectable()
export class WorkordersService {
  constructor(private prisma: PrismaService) {}
  list() { return this.prisma.workOrder.findMany(); }
  open() { return this.prisma.workOrder.findMany({ where: { status: { in: ['OPEN','PARTIAL'] } } }); }
  create(body:any) { return this.prisma.workOrder.create({ data: body }); }
  update(id:number, body:any) { return this.prisma.workOrder.update({ where: { id }, data: body }); }
  filled(id:number) { return this.prisma.workOrder.update({ where: { id }, data: { status: 'FILLED' } }); }
  async duplicate(id:number) {
    const src:any = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!src) return null;
    const { id:_, createdAt, ...rest } = src;
    return this.prisma.workOrder.create({ data: { ...rest, start: new Date() } });
  }
  remove(id:number) { return this.prisma.workOrder.delete({ where: { id } }); }
}
