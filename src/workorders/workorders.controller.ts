import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { WorkordersService } from './workorders.service';
import { CreateWorkOrderDto } from './dto/create-workorder.dto';
import { UpdateWorkOrderDto } from './dto/update-workorder.dto';

@Controller('work-orders')
export class WorkordersController {
  constructor(private readonly service: WorkordersService) {}

  @Post()
  create(@Body() body: CreateWorkOrderDto) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(BigInt(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateWorkOrderDto) {
    return this.service.update(BigInt(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(BigInt(id));
  }
}