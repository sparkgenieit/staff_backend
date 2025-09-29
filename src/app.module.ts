import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { WorkersModule } from './workers/workers.module';
import { ClientsModule } from './clients/clients.module';
import { WorkordersModule } from './workorders/workorders.module';
import { MatchingModule } from './matching/matching.module';
import { OffersModule } from './offers/offers.module';
import { ShiftsModule } from './shifts/shifts.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    WorkersModule,
    ClientsModule,
    WorkordersModule,
    MatchingModule,
    OffersModule,
    ShiftsModule,
    BillingModule
  ]
})
export class AppModule {}
