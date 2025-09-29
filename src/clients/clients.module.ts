import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma.service';
@Module({
  controllers: [ClientsController],
  providers: [PrismaService, ClientsService],
})
export class ClientsModule {}