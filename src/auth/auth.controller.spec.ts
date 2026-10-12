import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { TokenService } from '../common/services/token.service.js';
import { jest } from '@jest/globals';

describe('AuthController', () => {
  let controller: AuthController;
  let tokens: { rotate: jest.Mock; revoke: jest.Mock };

  beforeEach(async () => {
    tokens = { rotate: jest.fn(), revoke: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: TokenService, useValue: tokens },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns a token pair directly when refreshing', async () => {
    const tokenPair = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token-2',
      tokenType: 'Bearer' as const,
      expiresIn: 900,
    };
    tokens.rotate.mockResolvedValue(tokenPair);

    await expect(
      controller.refresh({ refreshToken: 'refresh-token-1' }),
    ).resolves.toEqual({
      data: tokenPair,
      message: 'Tokens refreshed successfully',
    });
  });

  it('revokes the refresh token on logout', async () => {
    await expect(
      controller.logout({ refreshToken: 'refresh-token' }),
    ).resolves.toBeUndefined();
    expect(tokens.revoke).toHaveBeenCalledWith('refresh-token');
  });
});
