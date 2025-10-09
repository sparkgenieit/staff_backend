import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly svc: ShiftsService) {}

  @Get()
  list() {
    // Frontend expects an array of shifts
    return this.svc.list();
  }

  // POST /shifts/:id/check-in  { lat:number, lng:number }
  @Post(':id/check-in')
  checkIn(
    @Param('id') id: string,
    @Body() body: { lat?: number; lng?: number },
  ) {
    const { lat, lng } = body ?? {};
    return this.svc.checkIn(Number(id), lat, lng);
  }

  // POST /shifts/:id/check-out { lat:number, lng:number }
  @Post(':id/check-out')
  checkOut(
    @Param('id') id: string,
    @Body() body: { lat?: number; lng?: number },
  ) {
    const { lat, lng } = body ?? {};
    return this.svc.checkOut(Number(id), lat, lng);
  }
}
