import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import type { Worker } from '../types';

@Injectable()
export class WorkersService {
  constructor(private db: DbService) {}
  list() { return this.db.list('workers'); }
  get(id:number) { return this.db.get('workers', id); }
  create(body: Omit<Worker,'id'>) { return this.db.create('workers', body); }
  update(id:number, patch: Partial<Worker>) { return this.db.update('workers', id, patch); }
  remove(id:number) { return this.db.remove('workers', id); }
}
