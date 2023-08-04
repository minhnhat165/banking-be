import { Inject, Injectable } from '@nestjs/common';
import { UserPermission } from './user-permission.model';
import { CreateUserPermissionDto } from './dto/create-user-permission.dto';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Pagination } from 'src/common/dto/pagination';

@Injectable()
export class UserPermissionsService {
  constructor(
    @Inject('UserPermissionRepository')
    private readonly userPermissionModel: typeof UserPermission,
  ) {}

  async findAll(
    paginationParams: PaginationParams,
  ): Promise<Pagination<UserPermission>> {
    //find all users with role
    const { page = 0, limit = 10, ...filter } = paginationParams;
    const { rows, count } = await this.userPermissionModel.findAndCountAll({
      limit,
      where: filter,
      offset: page * limit,
    });
    return {
      items: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }
  async addPermissionToUser(
    createUserPermissionDto: CreateUserPermissionDto,
  ): Promise<UserPermission> {
    const newUserPermission = new UserPermission();
    newUserPermission.userId = createUserPermissionDto.userId;
    newUserPermission.permissionId = createUserPermissionDto.permissionId;
    newUserPermission.screenId = createUserPermissionDto.screenId;
    if (createUserPermissionDto.permissionId === 1) {
      this.userPermissionModel.destroy({
        where: {
          userId: createUserPermissionDto.userId,
          screenId: createUserPermissionDto.screenId,
        },
      });
    }
    return newUserPermission.save();
  }

  async removePermissionFromUser(
    createUserPermissionDto: CreateUserPermissionDto,
  ): Promise<void> {
    await this.userPermissionModel.destroy({
      where: {
        ...createUserPermissionDto,
      },
    });
  }
}
