import {
  Controller,
  Request,
  Post,
  UseGuards,
  Get,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { Response } from 'src/common/types/responses';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    await this.authService.register(createUserDto);
    return {
      message:
        'User has been registered successfully check your email to activate your account',
    };
  }

  @Post('login')
  async login(@Body() body): Promise<
    Response<{
      accessToken: string;
    }>
  > {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    const { access_token } = await this.authService.login(user);
    return {
      message: 'User has been logged in successfully',
      data: {
        accessToken: access_token,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(
    @Request() req,
  ): Promise<Response<Omit<CreateUserDto, 'password'>>> {
    const user = await this.authService.getProfile(req.user.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...re } = user.dataValues;
    return {
      message: 'success',
      data: re,
    };
  }

  @Post('verify-email')
  async verifyEmail(@Body() body) {
    await this.authService.verifyEmail(body.token);
    return {
      message: 'User has been verified successfully',
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body) {
    await this.authService.forgotPassword(body.email);
    return {
      message: 'Please check your email to reset password',
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() body) {
    await this.authService.resetPassword(body.token, body.password);
    return {
      message: 'Password has been reset successfully',
    };
  }
}
