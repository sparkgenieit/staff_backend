import { Controller, Get, Param } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly svc: MatchingService) {}
  @Get(':workOrderId') recommend(@Param('workOrderId') id: string) { return this.svc.recommend(+id); }
}
