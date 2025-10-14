import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const MOCK_OTP = '123456'; // DEV ONLY

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  async requestLoginOtp(phone: string) {
    if (!phone || !/^\+?\d{10,15}$/.test(phone.replace(/\s+/g, ''))) {
      throw new BadRequestException('Invalid phone number');
    }
    const normalized = phone.replace(/\s+/g, '');

    // Ensure a minimal user exists (doTrip pattern)
    const existing = await this.prisma.user.findUnique({ where: { phone: normalized } });
    if (!existing) {
      await this.prisma.user.create({
        data: { phone: normalized, role: 'STAFF', name: 'Staff User', isActive: true },
      });
    }

    // eslint-disable-next-line no-console
    console.log(`[OTP:DEV] ${normalized} -> ${MOCK_OTP}`); // no "valid 5 min" text

    // No expiry returned anymore
    return { phone: normalized, dev: true };
  }

  async verifyLoginOtp(phone: string, code: string) {
    const normalized = phone.replace(/\s+/g, '');
    if (code !== MOCK_OTP) throw new UnauthorizedException('Invalid OTP (use 123456 in dev)');
    const user = await this.prisma.user.findUnique({ where: { phone: normalized } });
    if (!user || !user.isActive) throw new UnauthorizedException('User not found or inactive');
    return { id: user.id, phone: user.phone, role: user.role, name: user.name, email: user.email };
  }
}