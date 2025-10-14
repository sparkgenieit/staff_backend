import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly svc: ShiftsService) {}

  // --- Admin (unchanged) ---
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

  // --- Worker (staff) scoped: does NOT affect admin ---
  // Lists only the shifts of the logged-in user (linked Worker)
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  myShifts(@Req() req: Request) {
    const userId = (req as any).user?.userId as number | bigint;
    return this.svc.listForLoggedInWorker(userId);
  }
}