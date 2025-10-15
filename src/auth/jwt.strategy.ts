// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

type PayloadShape = {
  userId?: string | number;
  sub?: string | number;
  id?: string | number;
  role?: string;
  email?: string;
  name?: string;
  phone?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(cfg: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true, // accept tokens without exp
      secretOrKey: cfg.get<string>('JWT_SECRET') || 'dev_secret_change_me',
    });
  }

  async validate(payload: PayloadShape) {
    // Normalize user id from common JWT fields
    const raw = payload?.userId ?? payload?.sub ?? payload?.id;
    if (raw == null) {
      throw new UnauthorizedException('Invalid token payload: missing user id');
    }

    // Keep as string here; services can coerce with a safe BigInt helper
    const userId = String(raw);

    return {
      userId,
      role: payload?.role ?? 'STAFF',
      email: payload?.email ?? '',
      name: payload?.name ?? '',
      phone: payload?.phone ?? '',
    };
  }
}
