import { Module } from '@nestjs/common';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { CommonModule } from '../common/common.module';

@Module({ imports:[CommonModule], controllers:[WorkersController], providers:[WorkersService] })
export class WorkersModule {}
