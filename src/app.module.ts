import { Module } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AppController } from './app.controller.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), UserModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
