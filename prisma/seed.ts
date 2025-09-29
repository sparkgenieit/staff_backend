import { PrismaClient, RateUnit, RoleName, WorkOrderStatus, InvoiceStatus, PayoutStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.clientOrg.create({
    data: { name: 'Tech Solutions Pvt Ltd', billingEmail: 'billing@tech.com', creditDays: 30 }
  });
  const site = await prisma.site.create({
    data: { orgId: org.id, name: 'HQ', address: 'Noida', lat: 28.5355, lng: 77.3910 }
  });

  const w1 = await prisma.worker.create({
    data: { name: 'Priya Sharma', phone: '9876543210', baseRate: 150, rateUnit: RateUnit.HOUR, radiusKm: 10, rating: 4.8, strikes: 0 }
  });
  await prisma.workerSkill.create({ data: { workerId: w1.id, role: RoleName.maid } });
  await prisma.workerLanguage.create({ data: { workerId: w1.id, lang: 'Hindi' } });
  await prisma.workerLanguage.create({ data: { workerId: w1.id, lang: 'English' } });

  const wo = await prisma.workOrder.create({
    data: {
      orgId: org.id,
      siteId: site.id,
      roleName: RoleName.maid,
      headcount: 1,
      start: new Date(),
      durationMins: 480,
      budget: 1200,
      status: WorkOrderStatus.OPEN
    }
  });

  // Simple invoice with line
  const inv = await prisma.invoice.create({
    data: {
      orgId: org.id, subtotal: 1200, tax: 216, total: 1416, status: InvoiceStatus.PAID,
      lines: { create: [{ description: 'Maid - 8 hrs', qty: 1, unitPrice: 1200, amount: 1200 }] }
    },
    include: { lines: true }
  });

  await prisma.payout.create({
    data: { workerId: w1.id, totalAmount: 2600, status: PayoutStatus.PAID }
  });

  console.log({ org, site, w1, wo, inv });
}

main().finally(() => prisma.$disconnect());
