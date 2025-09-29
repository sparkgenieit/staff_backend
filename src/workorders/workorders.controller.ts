import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { WorkordersService } from './workorders.service';

@Controller('work-orders')
export class WorkordersController {
  constructor(private readonly svc: WorkordersService) {}
  @Get() list() { return this.svc.list(); }
  @Get('open') open() { return this.svc.open(); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(+id, body); }
  @Patch(':id/filled') filled(@Param('id') id: string) { return this.svc.filled(+id); }
  @Post(':id/duplicate') duplicate(@Param('id') id: string) { return this.svc.duplicate(+id); }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(+id); }
}
