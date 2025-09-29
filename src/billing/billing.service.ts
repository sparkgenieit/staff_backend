import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}
  invoices() { return this.prisma.invoice.findMany({ include: { lines: true } }); }
  async issue(orgId:number, lines:{ description:string; qty:number; unitPrice:number }[]) {
    const subtotal = lines.reduce((s,l)=> s + l.qty*l.unitPrice, 0);
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const total = subtotal + tax;
    const invoice = await this.prisma.invoice.create({
      data: { orgId, subtotal, tax, total, status: 'ISSUED', lines: { create: lines.map(l => ({ description:l.description, qty:l.qty, unitPrice:l.unitPrice, amount: l.qty*l.unitPrice })) } },
      include: { lines: true }
    });
    return { invoice };
  }
  markPaid(id:number) { return this.prisma.invoice.update({ where: { id }, data: { status: 'PAID' } }); }
  delInvoice(id:number) { return this.prisma.invoice.delete({ where: { id } }); }
  payouts() { return this.prisma.payout.findMany(); }
  payout(workerId:number, amount:number) { return this.prisma.payout.create({ data: { workerId, totalAmount: amount, status: 'PROCESSING' } }); }
  payoutPaid(id:number) { return this.prisma.payout.update({ where: { id }, data: { status: 'PAID' } }); }
  delPayout(id:number) { return this.prisma.payout.delete({ where: { id } }); }
}
