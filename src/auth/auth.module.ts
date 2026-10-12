import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service.js';
import { AccessTokenGuard } from './guards/access-token.guard.js';
import { TokenService } from '../common/services/token.service.js';
import { UserModule } from '../user/user.module.js';
import { AuthController } from './auth.controller.js';
import { PasswordService } from '../common/services/password.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [UserModule, PrismaModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    PasswordService,
    { provide: APP_GUARD, useClass: AccessTokenGuard },
  ],
})
export class AuthModule {}
