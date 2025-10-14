import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

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
    return this.svc.accept(+id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.svc.reject(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(+id);
  }

  // --- Worker (staff) scoped endpoints: do NOT affect admin ---
  // These rely on OffersService.listForLoggedInWorker / acceptForLoggedInWorker / rejectForLoggedInWorker

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  myOffers(@Req() req: Request) {
    const userId = (req as any).user?.userId as number | bigint;
    return this.svc.listForLoggedInWorker(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mine/:id/accept')
  acceptOwn(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.userId as number | bigint;
    return this.svc.acceptForLoggedInWorker(BigInt(id), userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mine/:id/reject')
  rejectOwn(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.userId as number | bigint;
    return this.svc.rejectForLoggedInWorker(BigInt(id), userId);
  }
}