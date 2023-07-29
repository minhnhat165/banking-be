import * as bcrypt from 'bcrypt';

import { CLIENT, JWT } from 'src/common/constant/env';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import { MailerService } from 'src/mailer/mailer.service';
import { USER } from 'src/common/constant/user';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { User } from 'src/users/user.model';
import { UsersService } from '../users/users.service';

type TokenType = 'verify-email' | 'reset-password';

type TokenPayload = {
  email: string;
  id: number;
  exp?: number;
};

const tokens_tmp: { [key: string]: { token: string; type: TokenType } } = {};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user.status !== USER.STATUS.ACTIVE) {
      throw new HttpException('User is not active', HttpStatus.UNAUTHORIZED);
    }
    if (user && bcrypt.compareSync(pass, user.password)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user.dataValues;
      return result;
    }
    return null;
  }
  async login(user: LoginUserDto & { id: number }) {
    const payload: TokenPayload = { email: user.email, id: user.id };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: JWT.SECRET,
        expiresIn: JWT.EXPIRES_IN,
      }),
    };
  }
  async register(user: CreateUserDto) {
    user.roleId = USER.ROLE.USER;
    const newUser = await this.usersService.create(user);
    const payload: TokenPayload = { email: newUser.email, id: newUser.id };
    const token = this.jwtService.sign(payload, {
      secret: JWT.EMAIL_SECRET,
      expiresIn: JWT.EMAIL_EXPIRES_IN,
    });

    tokens_tmp[newUser.email] = {
      token: token,
      type: 'verify-email',
    };

    const url = `${CLIENT.URL}/auth/verify-email?token=${token}`;

    const text =
      `Dear ${newUser.firstName} ${newUser.lastName},\n\n` +
      `Please click on the following link ${url} to verify your account.\n\n` +
      `If you did not request this, please ignore this email.\n`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Email confirmation',
      text: text,
    });
    return newUser;
  }

  async verifyEmail(token: string) {
    const payload: TokenPayload = this.jwtService.verify(token, {
      secret: JWT.EMAIL_SECRET,
    });
    // check if token is valid
    if (!payload) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
    // check if token is in tokens_tmp
    if (!tokens_tmp[payload.email]) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
    if (
      tokens_tmp[payload.email].token !== token &&
      tokens_tmp[payload.email].type !== 'verify-email'
    ) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    // check if token is expired
    const now = new Date();
    const exp = new Date(payload.exp * 1000);
    if (now > exp) {
      throw new HttpException('Token expired', HttpStatus.UNAUTHORIZED);
    }

    // remove token from tokens_tmp
    delete tokens_tmp[payload.email];

    await this.usersService.updateStatus(payload.id, USER.STATUS.ACTIVE);
  }

  async getProfile(id: number) {
    const user = await this.usersService.findById(id);
    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    const payload: TokenPayload = { email: user.email, id: user.id };
    const token = this.jwtService.sign(payload, {
      secret: JWT.RESET_PASSWORD_SECRET,
      expiresIn: JWT.RESET_PASSWORD_EXPIRES_IN,
    });
    const url = `${CLIENT.URL}/auth/reset-password?token=${token}`;
    const text =
      `Dear ${user.firstName} ${user.lastName},\n\n` +
      `Please click on the following link ${url} to reset your password.\n\n` +
      `If you did not request this, please ignore this email.\n`;
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Reset password',
      text: text,
    });
    tokens_tmp[user.email] = {
      token: token,
      type: 'reset-password',
    };
  }

  async resetPassword(token: string, password: string) {
    const payload: TokenPayload = this.jwtService.verify(token, {
      secret: JWT.RESET_PASSWORD_SECRET,
    });
    // check if token is valid
    if (!payload) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
    // check if token is in tokens_tmp
    if (!tokens_tmp[payload.email]) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
    if (
      tokens_tmp[payload.email].token !== token &&
      tokens_tmp[payload.email].type !== 'reset-password'
    ) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    // check if token is expired
    const now = new Date();
    const exp = new Date(payload.exp * 1000);
    if (now > exp) {
      throw new HttpException('Token expired', HttpStatus.UNAUTHORIZED);
    }

    // update password
    await this.usersService.updatePassword(payload.id, password);
    // remove token from tokens_tmp
    delete tokens_tmp[payload.email];
  }

  async changePassword(id: number, oldPassword: string, newPassword: string) {
    const user = await this.usersService.findById(id);
    if (!bcrypt.compareSync(oldPassword, user.password)) {
      throw new HttpException(
        'Old password is incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.usersService.updatePassword(id, newPassword);
  }
  async updateProfile(id: number, data: UpdateUserDto): Promise<User> {
    const user = await this.usersService.update(id, data);
    return user;
  }
}
