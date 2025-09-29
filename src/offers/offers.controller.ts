import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OffersService } from './offers.service';

@Controller('offers')
export class OffersController {
  constructor(private readonly svc: OffersService) {}
  @Get() list() { return this.svc.list(); }
  @Post(':workOrderId/send') send(@Param('workOrderId') workOrderId: string, @Body() body: { workerIds:number[] }) { return this.svc.send(+workOrderId, body.workerIds || []); }
  @Post(':offerId/accept') accept(@Param('offerId') offerId: string) { return this.svc.accept(+offerId); }
}
