import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';

@Injectable()
export class OffersService {
  constructor(private db: DbService) {}
  list() { return this.db.list('offers'); }
  send(workOrderId:number, workerIds:number[]) {
    const expiresAt = new Date(Date.now() + 10*60*1000).toISOString();
    workerIds.forEach(wid => this.db.create('offers', { workOrderId, workerId: wid, status: 'SENT', expiresAt }));
    return { ok:true };
  }
  accept(offerId:number) {
    const offer:any = this.db.update('offers', offerId, { status:'ACCEPTED' });
    if (offer) this.db.create('assignments', { workOrderId: offer.workOrderId, workerId: offer.workerId, final:true, createdAt: new Date().toISOString() });
    return { ok:true };
  }
}
