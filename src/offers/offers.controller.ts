import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { OffersService } from './offers.service';

@Controller('offers')
export class OffersController {
  constructor(private readonly svc: OffersService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  // body: { workOrderId:number; workerIds:number[]; expiresInMinutes?:number }
  @Post('send')
  send(@Body() body: any) {
    return this.svc.send(body);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string) {
    return this.svc.accept(+id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.svc.reject(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(+id);
  }
}
