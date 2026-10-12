import { Public } from '../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { TokenService } from '../common/services/token.service.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('sign-up')
  async signUp(@Body() body: SignUpDto) {
    const user = await this.authService.register(body);
    const tokens = await this.tokenService.issue(user.id);
    return {
      data: { user, ...tokens },
      message: 'Signed up successfully',
    };
  }

  @Post('sign-in')
  @HttpCode(200)
  async signIn(@Body() body: SignInDto) {
    const user = await this.authService.verify(body.email, body.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.tokenService.issue(user.id);
    return {
      data: { user, ...tokens },
      message: 'Signed in successfully',
    };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: RefreshTokenDto) {
    const tokens = await this.tokenService.rotate(body.refreshToken);
    return {
      data: tokens,
      message: 'Tokens refreshed successfully',
    };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() body: RefreshTokenDto): Promise<void> {
    await this.tokenService.revoke(body.refreshToken);
  }
}
