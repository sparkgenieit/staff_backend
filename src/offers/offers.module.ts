import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { PrismaService } from '../prisma.service';
@Module({
  controllers: [OffersController],
  providers: [PrismaService, OffersService],
})
export class OffersModule {}