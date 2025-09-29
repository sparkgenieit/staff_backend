import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import type { ClientOrg, Site } from '../types';

@Injectable()
export class ClientsService {
  constructor(private db: DbService) {}
  orgList() { return this.db.list('clientOrgs'); }
  orgCreate(body: Omit<ClientOrg,'id'>) { return this.db.create('clientOrgs', body); }
  orgUpdate(id:number, patch: Partial<ClientOrg>) { return this.db.update('clientOrgs', id, patch); }
  orgDelete(id:number) { return this.db.remove('clientOrgs', id); }

  siteList() { return this.db.list('sites'); }
  siteCreate(body: Omit<Site,'id'>) { return this.db.create('sites', body); }
  siteUpdate(id:number, patch: Partial<Site>) { return this.db.update('sites', id, patch); }
  siteDelete(id:number) { return this.db.remove('sites', id); }
}
