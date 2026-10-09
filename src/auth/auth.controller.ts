import { Public } from '../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import { SignUpDto } from './dto/signUp.dto.js';
import { SignInDto } from './dto/signIn.dto.js';
import { TokenService } from '../common/services/token.service.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';

@Public()
@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) { }

  /// User register
  @Post('sign-up')
  async signUp(@Body() body: SignUpDto) {
    const user = await this.authService.register(body);
    const tokens = await this.tokenService.issue(user.id);
    return {
      data: { user, ...tokens },
      message: "Signup successfully"
    }
  }

  /// User login
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
      message: "Signin successfully"
    }
  }

  /// Generate refresh token
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: RefreshTokenDto) {
    const refreshToken = await this.tokenService.rotate(body.refreshToken)
    return {
      data: { refreshToken },
      message: "Refresh token get successfully"
    }
  }

  /// Logout
  @Post('logout')
  @HttpCode(204)
  async logout(@Body() body: RefreshTokenDto) {
    await this.tokenService.revoke(body.refreshToken);
    return {
      message: "Logout successfully"
    }
  }
}
