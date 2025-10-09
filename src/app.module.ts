import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { WorkersModule } from './workers/workers.module';
import { ClientsModule } from './clients/clients.module';
import { WorkordersModule } from './workorders/workorders.module';
import { OffersModule } from './offers/offers.module';
import { MatchingModule } from './matching/matching.module';
import { ShiftsModule } from './shifts/shifts.module';
import { BillingModule } from './billing/billing.module';
import { AssignmentsModule } from './assignments/assignments.module';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), WorkersModule, AssignmentsModule, ClientsModule, WorkordersModule, OffersModule, MatchingModule, ShiftsModule, BillingModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
