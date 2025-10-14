import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { WorkersModule } from './workers/workers.module';
import { ClientsModule } from './clients/clients.module';
import { WorkordersModule } from './workorders/workorders.module';
import { OffersModule } from './offers/offers.module';
import { MatchingModule } from './matching/matching.module';
import { ShiftsModule } from './shifts/shifts.module';
import { BillingModule } from './billing/billing.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule, // ⬅️ add auth module
    WorkersModule,
    AssignmentsModule,
    ClientsModule,
    WorkordersModule,
    OffersModule,
    MatchingModule,
    ShiftsModule,
    BillingModule,
  ],
  providers: [
    PrismaService,
    { provide: APP_GUARD, useClass: JwtAuthGuard }, // ⬅️ protect all routes by default
  ],
  exports: [PrismaService],
})
export class AppModule {}
