import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}
  list() { return this.prisma.offer.findMany(); }
  async send(workOrderId:number, workerIds:number[]) {
    const expiresAt = new Date(Date.now() + 10*60*1000);
    if (workerIds.length) await this.prisma.offer.createMany({ data: workerIds.map(wid => ({ workOrderId, workerId: wid, expiresAt })) });
    return { ok:true };
  }
  async accept(offerId:number) {
    const offer = await this.prisma.offer.update({ where: { id: offerId }, data: { status: 'ACCEPTED' } });
    await this.prisma.assignment.create({ data: { workOrderId: offer.workOrderId, workerId: offer.workerId, final: true } });
    return { ok:true };
  }
}
