import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
@Injectable()
export class WorkersService {
  constructor(private prisma: PrismaService) {}
  list() { return this.prisma.worker.findMany({ include: { skills: true, langs: true } }); }
  get(id:number) { return this.prisma.worker.findUnique({ where: { id }, include: { skills: true, langs: true } }); }
  async create(body:any) {
    const { skills = [], langs = [], ...w } = body;
    const worker = await this.prisma.worker.create({ data: { ...w } });
    if (skills.length) await this.prisma.workerSkill.createMany({ data: skills.map((role:string)=>({ workerId: worker.id, role })) });
    if (langs.length) await this.prisma.workerLanguage.createMany({ data: langs.map((lang:string)=>({ workerId: worker.id, lang })) });
    return this.get(Number(worker.id));
  }
  async update(id:number, body:any) {
    const { skills, langs, ...w } = body;
    await this.prisma.worker.update({ where: { id }, data: w });
    if (skills) {
      await this.prisma.workerSkill.deleteMany({ where: { workerId: id } });
      if (skills.length) await this.prisma.workerSkill.createMany({ data: skills.map((role:string)=>({ workerId: id, role })) });
    }
    if (langs) {
      await this.prisma.workerLanguage.deleteMany({ where: { workerId: id } });
      if (langs.length) await this.prisma.workerLanguage.createMany({ data: langs.map((lang:string)=>({ workerId: id, lang })) });
    }
    return this.get(id);
  }
  remove(id:number) { return this.prisma.worker.delete({ where: { id } }); }
}
