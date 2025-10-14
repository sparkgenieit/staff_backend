import { Controller, Post, Body } from '@nestjs/common';
import { Public } from './public.decorator';
import { OtpService } from './otp.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly otp: OtpService, private readonly auth: AuthService) {}

  @Public()
  @Post('request-otp')
  requestOtp(@Body() body: { phone: string }) {
    return this.otp.requestLoginOtp(body.phone);
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(@Body() body: { phone: string; code: string }) {
    const _ = await this.otp.verifyLoginOtp(body.phone, body.code);
    return this.auth.issueForPhone(body.phone);
  }

  @Post('logout')
  async logout(@Body() body: { userId: number }) {
    return this.auth.logout(body.userId);
  }
}