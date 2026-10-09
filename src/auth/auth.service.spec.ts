import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';
import { UserRole } from '../generated/prisma/enums.js';
import { PasswordService } from '../common/services/password.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let users: {
    findByEmail: jest.Mock;
    createUser: jest.Mock;
    findCredentials: jest.Mock;
    updatePasswordHash: jest.Mock;
  };
  let passwords: {
    hash: jest.Mock;
    verify: jest.Mock;
    needsRehash: jest.Mock;
  };

  const user = {
    id: 'user-1',
    name: 'Customer',
    email: 'customer@example.com',
    phone: '1234567890',
    emailVerified: false,
    isActive: true,
    role: UserRole.CUSTOMER,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    users = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
      findCredentials: jest.fn(),
      updatePasswordHash: jest.fn(),
    };
    passwords = {
      hash: jest.fn(),
      verify: jest.fn(),
      needsRehash: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: users },
        { provide: PasswordService, useValue: passwords },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('verifies the password against the stored hash', async () => {
    users.findCredentials.mockResolvedValue({
      user,
      passwordHash: '$scrypt$stored',
    });
    passwords.verify.mockResolvedValue(true);
    passwords.needsRehash.mockReturnValue(false);

    await expect(
      service.verify('customer@example.com', 'correct password'),
    ).resolves.toBe(user);
    expect(passwords.verify).toHaveBeenCalledWith(
      'correct password',
      '$scrypt$stored',
    );
  });

  it('uses a dummy password check for an unknown email', async () => {
    users.findCredentials.mockResolvedValue(null);
    passwords.verify.mockResolvedValue(false);

    await expect(
      service.verify('unknown@example.com', 'wrong password'),
    ).resolves.toBeNull();
    expect(passwords.verify).toHaveBeenCalledWith('wrong password', undefined);
  });
});
