import { Module } from '@nestjs/common';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { PrismaService } from '../prisma.service';
@Module({
  controllers: [WorkersController],
  providers: [PrismaService, WorkersService],
})
export class WorkersModule {}