import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';

@Injectable()
export class MatchingService {
  constructor(private db: DbService) {}
  private score(worker:any) {
    const distanceFit = 0.8, availability = 1, rating = Math.min((worker.rating||4.5)/5,1), priceFit=1, utilization=0.5, reliability=1-Math.min((worker.strikes||0)/5,1);
    return 40*distanceFit + 20*availability + 15*rating + 10*priceFit + 10*utilization + 5*reliability;
  }
  recommend(workOrderId:number) {
    const wo:any = this.db.get('workOrders', workOrderId);
    if (!wo) return [];
    const pool = this.db.list('workers').filter((w:any)=> (w.skills||[]).includes(wo.roleName));
    return pool.map(w=> ({ worker:w, score:this.score(w), distanceKm: Math.round(2 + Math.random()*4) }))
      .sort((a,b)=> b.score - a.score).slice(0,5);
  }
}
