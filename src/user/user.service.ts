import type { AuthUser } from './auth-user.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConflictException, Injectable } from '@nestjs/common';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  isVerified: true,
  isActive: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

type PublicUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  isActive: boolean;
  role: AuthUser['role'];
  createdAt: Date;
  updatedAt: Date;
};

const normalizeEmail = (email: string) =>
  email.trim().normalize('NFC').toLowerCase();

const toAuthUser = (user: PublicUserRow): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  emailVerified: user.isVerified,
  isActive: user.isActive,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(input: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
  }): Promise<AuthUser> {
    try {
      const user = await this.prisma.user.create({
        data: {
          name: input.name.trim(),
          email: normalizeEmail(input.email),
          phone: input.phone.trim(),
          hashedPassword: input.passwordHash,
        },
        select: publicUserSelect,
      });
      return toAuthUser(user);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: publicUserSelect,
    });
    return user ? toAuthUser(user) : null;
  }

  /** Password hashes leave the repository only for password verification. */
  async findCredentials(
    email: string,
  ): Promise<{ user: AuthUser; passwordHash: string } | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: { ...publicUserSelect, hashedPassword: true },
    });
    if (!row) return null;
    const { hashedPassword, ...user } = row;
    return { user: toAuthUser(user), passwordHash: hashedPassword };
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { hashedPassword: passwordHash },
    });
  }

  async findUserById(userId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: publicUserSelect,
    });
    return user ? toAuthUser(user) : null;
  }

  async findAllUsers(): Promise<AuthUser[]> {
    const users = await this.prisma.user.findMany({ select: publicUserSelect });
    return users.map(toAuthUser);
  }
}
