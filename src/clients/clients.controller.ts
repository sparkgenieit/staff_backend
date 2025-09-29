import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly svc: ClientsService) {}
  @Get('org') orgList() { return this.svc.orgList(); }
  @Post('org') orgCreate(@Body() body: any) { return this.svc.orgCreate(body); }
  @Put('org/:id') orgUpdate(@Param('id') id: string, @Body() body: any) { return this.svc.orgUpdate(+id, body); }
  @Delete('org/:id') orgDelete(@Param('id') id: string) { return this.svc.orgDelete(+id); }
  @Get('site') siteList() { return this.svc.siteList(); }
  @Post('site') siteCreate(@Body() body: any) { return this.svc.siteCreate(body); }
  @Put('site/:id') siteUpdate(@Param('id') id: string, @Body() body: any) { return this.svc.siteUpdate(+id, body); }
  @Delete('site/:id') siteDelete(@Param('id') id: string) { return this.svc.siteDelete(+id); }
}
