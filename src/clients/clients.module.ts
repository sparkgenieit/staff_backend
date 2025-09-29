import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { CommonModule } from '../common/common.module';

@Module({ imports:[CommonModule], controllers:[ClientsController], providers:[ClientsService] })
export class ClientsModule {}
