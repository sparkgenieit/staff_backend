import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}
  private score(worker:any) {
    const distanceFit = 0.8, availability = 1, rating = Math.min(Number(worker.rating||4.5)/5,1), priceFit=1, utilization=0.5, reliability=1-Math.min((worker.strikes||0)/5,1);
    return 40*distanceFit + 20*availability + 15*rating + 10*priceFit + 10*utilization + 5*reliability;
  }
  async recommend(workOrderId:number) {
    const wo = await this.prisma.workOrder.findUnique({ where: { id: workOrderId } });
    if (!wo) return [];
    const pool = await this.prisma.worker.findMany({ where: { skills: { some: { role: wo.roleName } } } });
    return pool.map(w=> ({ worker:w, score:this.score(w), distanceKm: Math.round(2 + Math.random()*4) }))
      .sort((a,b)=> b.score - a.score).slice(0,5);
  }
}
