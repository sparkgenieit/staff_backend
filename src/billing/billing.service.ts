import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';

@Injectable()
export class BillingService {
  constructor(private db: DbService) {}
  invoices() { return this.db.list('invoices'); }
  issue(orgId:number, lines:{ description:string; qty:number; unitPrice:number }[]) {
    const subtotal = lines.reduce((s,l)=> s + l.qty*l.unitPrice, 0);
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + tax;
    const inv = this.db.create('invoices', { orgId, subtotal, tax, total, status:'ISSUED', createdAt: new Date().toISOString() });
    lines.forEach(l => this.db.create('invoiceLines', { invoiceId: inv.id, description:l.description, qty:l.qty, unitPrice:l.unitPrice, amount:l.qty*l.unitPrice }));
    return { invoice: inv };
  }
  markPaid(id:number) { return this.db.update('invoices', id, { status:'PAID' }); }
  delInvoice(id:number) { return this.db.remove('invoices', id); }
  payouts() { return this.db.list('payouts'); }
  payout(workerId:number, amount:number) { return this.db.create('payouts', { workerId, totalAmount: amount, status:'PROCESSING', initiatedAt: new Date().toISOString(), createdAt: new Date().toISOString() }); }
  payoutPaid(id:number) { return this.db.update('payouts', id, { status:'PAID' }); }
  delPayout(id:number) { return this.db.remove('payouts', id); }
}
