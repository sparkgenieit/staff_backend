import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}
  list() { return this.prisma.shift.findMany(); }
  create(assignmentId:number, start:Date, end:Date) { return this.prisma.shift.create({ data: { assignmentId, startPlanned: start, endPlanned: end, status: 'PLANNED' } }); }
  async checkin(shiftId:number, lat:number, lng:number, photoUrl?:string) {
    await this.prisma.shift.update({ where: { id: shiftId }, data: { startActual: new Date(), status: 'IN_PROGRESS' } });
    const att = await this.prisma.attendance.findUnique({ where: { shiftId } });
    if (att) await this.prisma.attendance.update({ where: { shiftId }, data: { inLat: lat, inLng: lng, inPhoto: photoUrl } });
    else await this.prisma.attendance.create({ data: { shiftId, inLat: lat, inLng: lng, inPhoto: photoUrl } });
    return { ok:true };
  }
  async checkout(shiftId:number, lat:number, lng:number, photoUrl?:string) {
    await this.prisma.shift.update({ where: { id: shiftId }, data: { endActual: new Date(), status: 'COMPLETED' } });
    const att = await this.prisma.attendance.findUnique({ where: { shiftId } });
    if (att) await this.prisma.attendance.update({ where: { shiftId }, data: { outLat: lat, outLng: lng, outPhoto: photoUrl } });
    else await this.prisma.attendance.create({ data: { shiftId, outLat: lat, outLng: lng, outPhoto: photoUrl } });
    return { ok:true };
  }
}
