import { Module } from '@nestjs/common';
import { WorkordersController } from './workorders.controller';
import { WorkordersService } from './workorders.service';
import { CommonModule } from '../common/common.module';

@Module({ imports:[CommonModule], controllers:[WorkordersController], providers:[WorkordersService] })
export class WorkordersModule {}
