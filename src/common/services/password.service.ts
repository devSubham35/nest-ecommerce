import { compare, hash } from 'bcrypt';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PasswordService {

  private readonly rounds = 12;

  hash(password: string): Promise<string> {
    return hash(password, this.rounds);
  }

  verify(password: string, passwordHash?: string): Promise<boolean> {
    return compare(
      password,
      passwordHash ??
        '$2b$12$C6UzMDM.H6dfI/f/IKcEe.5tYgQpG7sVQ9xT0S8pQ1qHfN3Jv2O7a',
    );
  }

  needsRehash(passwordHash: string): boolean {
    const rounds = Number(passwordHash.split('$')[2]);
    return !Number.isFinite(rounds) || rounds < this.rounds;
  }
}
