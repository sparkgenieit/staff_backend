import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import type { WorkOrder } from '../types';

@Injectable()
export class WorkordersService {
  constructor(private db: DbService) {}
  list() { return this.db.list('workOrders'); }
  open() { return this.db.list('workOrders').filter((w:any)=> ['OPEN','PARTIAL'].includes(w.status)); }
  create(body: Omit<WorkOrder,'id'>) { return this.db.create('workOrders', body); }
  update(id:number, patch: Partial<WorkOrder>) { return this.db.update('workOrders', id, patch); }
  filled(id:number) { return this.db.update('workOrders', id, { status: 'FILLED' }); }
  duplicate(id:number) {
    const src:any = this.db.get('workOrders', id);
    if (!src) return null;
    const copy = { ...src, id: undefined, start: new Date().toISOString() };
    return this.db.create('workOrders', copy);
  }
  remove(id:number) { return this.db.remove('workOrders', id); }
}
