import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller()
export class BillingController {
  constructor(private readonly svc: BillingService) {}
  @Get('invoices') invoices() { return this.svc.invoices(); }
  @Post('billing/invoice') issue(@Body() body: { orgId:number; lines:{ description:string; qty:number; unitPrice:number }[] }) { return this.svc.issue(body.orgId, body.lines); }
  @Post('invoices/:id/markPaid') markPaid(@Param('id') id:string) { return this.svc.markPaid(+id); }
  @Delete('invoices/:id') delInvoice(@Param('id') id:string) { return this.svc.delInvoice(+id); }
  @Get('payouts') payouts() { return this.svc.payouts(); }
  @Post('billing/payout') payout(@Body() body: { workerId:number; amount:number }) { return this.svc.payout(body.workerId, body.amount); }
  @Post('payouts/:id/markPaid') payoutPaid(@Param('id') id:string) { return this.svc.payoutPaid(+id); }
  @Delete('payouts/:id') delPayout(@Param('id') id:string) { return this.svc.delPayout(+id); }
}
