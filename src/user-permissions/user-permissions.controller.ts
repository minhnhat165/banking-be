import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserPermissionsService } from './user-permissions.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { UserPermission } from './user-permission.model';
import { Response } from 'src/common/types/responses';
import { Pagination } from 'src/common/dto/pagination';
import { CreateUserPermissionDto } from './dto/create-user-permission.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('user-permissions')
export class UserPermissionsController {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
    private eventEmitter: EventEmitter2,
  ) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParams,
  ): Promise<Response<Pagination<UserPermission>>> {
    const data = await this.userPermissionsService.findAll(paginationParams);
    return {
      message: 'Users have been found successfully',
      data: data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addPermissionToUser(
    @Body() createUserPermissionDto: CreateUserPermissionDto,
  ): Promise<Response<UserPermission>> {
    const newUserPermission =
      await this.userPermissionsService.addPermissionToUser(
        createUserPermissionDto,
      );
    this.eventEmitter.emit('permission.update', createUserPermissionDto.userId);
    return {
      message: 'User permission has been created successfully',
      data: newUserPermission,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('remove')
  async removePermissionFromUser(
    @Body() createUserPermissionDto: CreateUserPermissionDto,
  ): Promise<Response<UserPermission>> {
    await this.userPermissionsService.removePermissionFromUser(
      createUserPermissionDto,
    );
    this.eventEmitter.emit('permission.update', createUserPermissionDto.userId);
    return {
      message: 'User permission has been removed successfully',
      data: null,
    };
  }
}
