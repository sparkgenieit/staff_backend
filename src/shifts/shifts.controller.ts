import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly svc: ShiftsService) {}
  @Get() list() { return this.svc.list(); }
  @Post(':assignmentId/create') create(@Param('assignmentId') assignmentId: string, @Body() body: { start:string; end:string; }) { return this.svc.create(+assignmentId, body.start, body.end); }
  @Post(':shiftId/checkin') checkin(@Param('shiftId') shiftId: string, @Body() body: { lat:number; lng:number; photoUrl?:string; }) { return this.svc.checkin(+shiftId, body.lat, body.lng, body.photoUrl); }
  @Post(':shiftId/checkout') checkout(@Param('shiftId') shiftId: string, @Body() body: { lat:number; lng:number; photoUrl?:string; }) { return this.svc.checkout(+shiftId, body.lat, body.lng, body.photoUrl); }
}
