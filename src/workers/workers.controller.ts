import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';

@Controller('workers')
export class WorkersController {
  constructor(private readonly service: WorkersService) {}

  @Post()
  create(@Body() body: CreateWorkerDto) {
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
  update(@Param('id') id: string, @Body() body: UpdateWorkerDto) {
    return this.service.update(BigInt(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(BigInt(id));
  }
}