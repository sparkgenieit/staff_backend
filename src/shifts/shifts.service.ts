import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';

@Injectable()
export class ShiftsService {
  constructor(private db: DbService) {}
  list() { return this.db.list('shifts'); }
  create(assignmentId:number, start:string, end:string) { return this.db.create('shifts', { assignmentId, startPlanned:start, endPlanned:end, status:'PLANNED' }); }
  checkin(shiftId:number, lat:number, lng:number, photoUrl?:string) {
    this.db.update('shifts', shiftId, { startActual: new Date().toISOString(), status:'IN_PROGRESS' });
    const att = (this.db.list('attendance') as any[]).find(a=> a.shiftId === shiftId);
    if (att) this.db.update('attendance', att.id, { inLat:lat, inLng:lng, inPhoto:photoUrl });
    else this.db.create('attendance', { shiftId, inLat:lat, inLng:lng, inPhoto:photoUrl });
    return { ok:true };
  }
  checkout(shiftId:number, lat:number, lng:number, photoUrl?:string) {
    this.db.update('shifts', shiftId, { endActual: new Date().toISOString(), status:'COMPLETED' });
    const att = (this.db.list('attendance') as any[]).find(a=> a.shiftId === shiftId);
    if (att) this.db.update('attendance', att.id, { outLat:lat, outLng:lng, outPhoto:photoUrl });
    else this.db.create('attendance', { shiftId, outLat:lat, outLng:lng, outPhoto:photoUrl });
    return { ok:true };
  }
}
