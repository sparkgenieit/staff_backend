import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { PrismaService } from '../prisma.service';
@Module({
  controllers: [MatchingController],
  providers: [PrismaService, MatchingService],
})
export class MatchingModule {}