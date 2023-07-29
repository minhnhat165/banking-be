import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { Response } from 'src/common/types/responses';
import { Pagination } from 'src/common/dto/pagination';
import { PaginationParams } from 'src/common/dto/paginationParams';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

  @Get(':id')
  async findById(@Param('id') id: number): Promise<User> {
    return this.usersService.findById(id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<Response<User>> {
    const newUser = await this.usersService.create(createUserDto);
    return {
      message: 'User has been created successfully',
      data: newUser,
    };
  }
}
