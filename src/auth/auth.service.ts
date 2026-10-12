import type { SignUpDto } from './dto/sign-up.dto.js';
import type { AuthUser } from '../user/auth-user.js';
import { UserService } from '../user/user.service.js';
import { Injectable } from '@nestjs/common';
import { PasswordService } from '../common/services/password.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordHasher: PasswordService,
  ) {}

  async register(body: SignUpDto): Promise<AuthUser> {
    const hashedPassword = await this.passwordHasher.hash(body.password);

    return this.userService.createUser({
      name: body.name,
      email: body.email,
      phone: body.phone,
      passwordHash: hashedPassword,
    });
  }

  async verify(email: string, password: string): Promise<AuthUser | null> {
    const found = await this.userService.findCredentials(email);
    const valid = await this.passwordHasher.verify(
      password,
      found?.passwordHash,
    );

    if (!valid || !found || !found.user.isActive) return null;

    if (this.passwordHasher.needsRehash(found.passwordHash)) {
      await this.userService.updatePasswordHash(
        found.user.id,
        await this.passwordHasher.hash(password),
      );
    }

    return found.user;
  }
}
