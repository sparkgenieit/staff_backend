import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma.service';
@Module({
  controllers: [BillingController],
  providers: [PrismaService, BillingService],
})
export class BillingModule {}