import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { WorkersService } from './workers.service';

@Controller('workers')
export class WorkersController {
  constructor(private readonly svc: WorkersService) {}
  @Get() list() { return this.svc.list(); }
  @Get(':id') get(@Param('id') id: string) { return this.svc.get(+id); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(+id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(+id); }
}
