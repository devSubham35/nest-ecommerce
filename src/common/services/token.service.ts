import { createHash, randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { UserService } from '../../user/user.service.js';

export interface AccessTokenPayload {
  sub: string;
  type: 'access';
}

interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  jti: string;
  familyId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

@Injectable()
export class TokenService {
  private readonly accessTtl: number;
  private readonly refreshTtl: number;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly users: UserService,
  ) {
    this.accessTtl = this.positiveSeconds('JWT_ACCESS_TTL_SECONDS', 15 * 60);
    this.refreshTtl = this.positiveSeconds(
      'JWT_REFRESH_TTL_SECONDS',
      7 * 24 * 60 * 60,
    );
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  async issue(
    userId: string,
    familyId: string = randomUUID(),
  ): Promise<TokenPair> {
    const tokenId = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, type: 'refresh', jti: tokenId, familyId },
      { secret: this.refreshSecret, expiresIn: this.refreshTtl },
    );
    const accessToken = await this.jwt.signAsync<AccessTokenPayload>(
      { sub: userId, type: 'access' },
      { secret: this.accessSecret, expiresIn: this.accessTtl },
    );

    await this.prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId,
        familyId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtl * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTtl,
    };
  }

  async rotate(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
    });

    if (
      !stored ||
      stored.id !== payload.jti ||
      stored.userId !== payload.sub ||
      stored.familyId !== payload.familyId ||
      stored.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (stored.revokedAt) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const user = await this.users.findUserById(stored.userId);
    if (!user) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException('User is inactive or no longer exists');
    }

    const revoked = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { revokedAt: new Date() },
    });
    if (revoked.count !== 1) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    return this.issue(stored.userId, stored.familyId);
  }

  async revoke(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
    });
    if (!stored || stored.id !== payload.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.revokeFamily(stored.familyId);
  }

  private async verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.refreshSecret,
      });
      if (
        payload.type !== 'refresh' ||
        !payload.sub ||
        !payload.jti ||
        !payload.familyId
      ) {
        throw new Error();
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private revokeFamily(familyId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private positiveSeconds(name: string, fallback: number): number {
    const value = Number(this.config.get<string>(name) ?? fallback);
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${name} must be a positive integer`);
    }
    return value;
  }
}
