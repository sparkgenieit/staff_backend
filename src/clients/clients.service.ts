import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}
  orgList() { return this.prisma.clientOrg.findMany(); }
  orgCreate(body:any) { return this.prisma.clientOrg.create({ data: body }); }
  orgUpdate(id:number, body:any) { return this.prisma.clientOrg.update({ where: { id }, data: body }); }
  orgDelete(id:number) { return this.prisma.clientOrg.delete({ where: { id } }); }
  siteList() { return this.prisma.site.findMany(); }
  siteCreate(body:any) { return this.prisma.site.create({ data: body }); }
  siteUpdate(id:number, body:any) { return this.prisma.site.update({ where: { id }, data: body }); }
  siteDelete(id:number) { return this.prisma.site.delete({ where: { id } }); }
}
