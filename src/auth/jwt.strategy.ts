import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(cfg: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true, // accept tokens without exp
      secretOrKey: cfg.get<string>('JWT_SECRET') || 'dev_secret_change_me',
    });
  }
  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, role: payload.role, name: payload.name, phone: payload.phone };
  }
}