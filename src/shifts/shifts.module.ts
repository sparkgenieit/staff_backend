import { Module } from '@nestjs/common';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { CommonModule } from '../common/common.module';

@Module({ imports:[CommonModule], controllers:[ShiftsController], providers:[ShiftsService] })
export class ShiftsModule {}
