import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { CommonModule } from '../common/common.module';

@Module({ imports:[CommonModule], controllers:[MatchingController], providers:[MatchingService] })
export class MatchingModule {}
