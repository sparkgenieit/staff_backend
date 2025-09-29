import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { CommonModule } from '../common/common.module';

@Module({ imports:[CommonModule], controllers:[OffersController], providers:[OffersService] })
export class OffersModule {}
