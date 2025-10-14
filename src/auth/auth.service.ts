import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';

type AppRole = 'ADMIN' | 'STAFF' | 'CLIENT';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private async issueAndPersist(userId: bigint) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, phone: true, isActive: true },
    });
    if (!u || !u.isActive) throw new UnauthorizedException('User not found or inactive');

    const payload = {
      sub: Number(u.id),
      email: u.email || '',
      name: u.name || '',
      role: u.role as AppRole,
      phone: u.phone || '',
    };

    // No expiresIn passed → JWT without exp claim (valid until logout)
    const accessToken = await this.jwt.signAsync(payload);

    await this.prisma.user.update({
      where: { id: u.id },
      data: { accessToken, tokenExpiresAt: null, lastLoginAt: new Date() },
    });

    return { accessToken, user: payload };
  }

  async issueForPhone(phone: string) {
    const normalized = phone.replace(/\s+/g, '');
    let user = await this.prisma.user.findUnique({ where: { phone: normalized } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: normalized,
          role: 'STAFF',
          name: 'Staff User',
          isActive: true,
        },
      });
    }
    return this.issueAndPersist(user.id);
  }

  // Explicit logout: clear token from User row
  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: BigInt(userId) },
      data: { accessToken: null, tokenExpiresAt: null },
    });
    return { ok: true };
  }
}