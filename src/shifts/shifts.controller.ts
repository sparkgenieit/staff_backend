import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

function toBigIntId(id: string | number | bigint): bigint {
  try {
    return BigInt(String(id));
  } catch {
    throw new BadRequestException('Invalid id format');
  }
}

function requireUserIdBigInt(req: Request): bigint {
  // Access the passport-injected user in a type-safe way without ts-expect-error
  const u = (req as any)?.user ?? {};
  const raw = u.userId ?? u.sub ?? u.id;
  if (raw == null) {
    throw new UnauthorizedException('No user id in token');
  }
  return toBigIntId(raw);
}

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
    return this.svc.checkIn(toBigIntId(id), lat, lng);
  }

  // POST /shifts/:id/check-out { lat:number, lng:number }
  @Post(':id/check-out')
  checkOut(
    @Param('id') id: string,
    @Body() body: { lat?: number; lng?: number },
  ) {
    const { lat, lng } = body ?? {};
    return this.svc.checkOut(toBigIntId(id), lat, lng);
  }

  // --- Worker (staff) scoped: does NOT affect admin ---
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  myShifts(@Req() req: Request) {
    const userId = requireUserIdBigInt(req);
    return this.svc.listForLoggedInWorker(userId);
  }
}
