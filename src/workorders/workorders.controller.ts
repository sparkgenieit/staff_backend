import { Body, Controller, Delete, Get, Param, Patch, Post, Put, ParseIntPipe } from '@nestjs/common';
import { WorkordersService } from './workorders.service';

@Controller('work-orders')
export class WorkordersController {
  constructor(private readonly svc: WorkordersService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Get('open')
  open() {
    return this.svc.open();
  }

  @Post()
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Patch(':id/filled')
  filled(@Param('id', ParseIntPipe) id: number) {
    return this.svc.filled(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id', ParseIntPipe) id: number) {
    return this.svc.duplicate(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
