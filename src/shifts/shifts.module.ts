import { Module } from '@nestjs/common';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { PrismaService } from '../prisma.service';
@Module({
  controllers: [ShiftsController],
  providers: [PrismaService, ShiftsService],
})
export class ShiftsModule {}