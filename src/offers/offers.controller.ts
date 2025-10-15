// src/offers/offers.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { OffersService } from './offers.service';
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
  const u = (req as any)?.user ?? {};
  const raw = u.userId ?? u.sub ?? u.id;
  if (raw == null) {
    throw new UnauthorizedException('No user id in token');
  }
  return toBigIntId(raw);
}

@Controller('offers')
export class OffersController {
  constructor(private readonly svc: OffersService) {}

  // --- Admin endpoints (unchanged) ---
  @Get()
  list() {
    return this.svc.list();
  }

  // body: { workOrderId:number; workerIds:number[]; expiresInMinutes?:number }
  @Post('send')
  send(@Body() body: any) {
    return this.svc.send(body);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string) {
    return this.svc.accept(toBigIntId(id));
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.svc.reject(toBigIntId(id));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(toBigIntId(id));
  }

  // --- Worker (staff) scoped endpoints: do NOT affect admin ---
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  myOffers(@Req() req: Request) {
    const userId = requireUserIdBigInt(req);
    return this.svc.listForLoggedInWorker(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mine/:id/accept')
  acceptOwn(@Param('id') id: string, @Req() req: Request) {
    const userId = requireUserIdBigInt(req);
    return this.svc.acceptForLoggedInWorker(toBigIntId(id), userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mine/:id/reject')
  rejectOwn(@Param('id') id: string, @Req() req: Request) {
    const userId = requireUserIdBigInt(req);
    return this.svc.rejectForLoggedInWorker(toBigIntId(id), userId);
  }
}
