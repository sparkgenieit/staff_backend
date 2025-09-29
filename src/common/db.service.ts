import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Db } from '../types';

@Injectable()
export class DbService {
  private file = join(process.cwd(), 'data', 'db.json');
  private seedFile = join(process.cwd(), 'data', 'seed.json');
  private data: Db;

  constructor() {
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    if (!existsSync(this.file)) {
      const seed = readFileSync(this.seedFile, 'utf-8');
      writeFileSync(this.file, seed, 'utf-8');
    }
    this.data = JSON.parse(readFileSync(this.file, 'utf-8'));
  }

  private save() { writeFileSync(this.file, JSON.stringify(this.data, null, 2), 'utf-8'); }
  public list<T extends keyof Db>(key: T) { return this.data[key] as any[]; }
  public get<T extends keyof Db>(key: T, id: number) { return (this.data[key] as any[]).find((x:any)=> x.id === id); }
  public create<T extends keyof Db>(key: T, record: any) {
    const arr = this.data[key] as any[]; const id = Math.max(0, ...arr.map(x=>x.id||0)) + 1;
    const created = { ...record, id }; arr.push(created); this.save(); return created;
  }
  public update<T extends keyof Db>(key: T, id: number, patch: any) {
    const arr = this.data[key] as any[]; const idx = arr.findIndex((x:any)=> x.id === id);
    if (idx === -1) return null; arr[idx] = { ...arr[idx], ...patch }; this.save(); return arr[idx];
  }
  public remove<T extends keyof Db>(key: T, id: number) {
    const arr = this.data[key] as any[]; const idx = arr.findIndex((x:any)=> x.id === id);
    if (idx === -1) return false; arr.splice(idx,1); this.save(); return true;
  }
}
