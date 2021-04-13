import { Repository, EntityRepository } from 'typeorm';
import { User } from './user.entity';
import {
  AuthCredentialsDto,
  AuthSignInCredentialsDto,
} from './dto/auth-credentials.dto';
import * as bcrypt from 'bcryptjs';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const {
      firstName,
      lastName,
      // userType,
      email,
      password,
    } = authCredentialsDto;
    const user = this.create(); //new User();
    user.firstName = firstName;
    user.lastName = lastName;
    // user.userType = userType;
    user.email = email;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);

    try {
      await user.save();
    } catch (error) {
      console.log(error);
      if (error.code === '23505') {
        // duplicate username
        throw new ConflictException('account already exist');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async validateUserPassword(
    authSignInCredentialsDto: AuthSignInCredentialsDto,
  ): Promise<User> {
    const { email, password } = authSignInCredentialsDto;
    const user = await this.findOne({ email });
    if (user && (await user.validatePassword(password))) {
      delete user.password;
      delete user.salt;
      return user;
    } else {
      return null;
    }
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
}
