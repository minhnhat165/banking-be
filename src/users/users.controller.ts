import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { Response } from 'src/common/types/responses';
import { Pagination } from 'src/common/dto/pagination';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParams,
  ): Promise<Response<Pagination<User>>> {
    const data = await this.usersService.findAll(paginationParams);
    return {
      message: 'Users have been found successfully',
      data: data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(@Param('id') id: number): Promise<User> {
    return this.usersService.findById(id);
  }
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<Response<User>> {
    const newUser = await this.usersService.create(createUserDto);
    return {
      message: 'User has been created successfully',
      data: newUser,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateProfile(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...re } = user.dataValues;
    return {
      message: 'success',
      data: re,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: number): Promise<Response<User>> {
    await this.usersService.delete(id);
    return {
      message: 'User has been deleted successfully',
      data: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/lock')
  async lock(@Param('id') id: number): Promise<Response<User>> {
    await this.usersService.lock(id);
    return {
      message: 'User has been locked successfully',
      data: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/unlock')
  async unlock(@Param('id') id: number): Promise<Response<User>> {
    await this.usersService.unlock(id);
    return {
      message: 'User has been unlocked successfully',
      data: null,
    };
  }
}
