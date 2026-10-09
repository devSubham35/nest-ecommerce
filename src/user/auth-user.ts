import type { UserRole } from '../generated/prisma/enums.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  isActive: boolean;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
