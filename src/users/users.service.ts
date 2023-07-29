import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { generateAvatar } from 'src/utils/generate-avatar';
import { UpdateUserDto } from './dto/update-user.dto';
import { Pagination } from 'src/common/dto/pagination';
import { PaginationParams } from 'src/common/dto/paginationParams';
@Injectable()
export class UsersService {
  constructor(
    @Inject('UserRepository')
    private readonly userModel: typeof User,
  ) {}

  async findAll({
    page = 0,
    limit = 10,
  }: PaginationParams): Promise<Pagination<User>> {
    //find all users with role
    const { rows, count } = await this.userModel.findAndCountAll({
      include: ['role'],
      limit,
      offset: page * limit,
    });
    return {
      items: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findById(id: number): Promise<User> {
    return this.userModel.findByPk(id);
  }

  async findByEmail(email: string, allowDuplicate = false): Promise<User> {
    const user = await this.userModel.findOne({
      where: {
        email,
      },
    });
    if (!user && !allowDuplicate) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(user: CreateUserDto): Promise<User> {
    const isExist = await this.findByEmail(user.email, true);
    if (isExist) {
      throw new ConflictException('Email already exists');
    }
    const newUser = new User();
    newUser.email = user.email;
    newUser.password = await bcrypt.hash(user.password, 10);
    newUser.firstName = user.firstName;
    newUser.lastName = user.lastName;
    newUser.dob = user.dob;
    newUser.phone = user.phone;
    newUser.address = user.address;
    newUser.roleId = user.roleId;
    newUser.avatar = generateAvatar(user.firstName + ' ' + user.lastName);
    return newUser.save();
  }

  async update(id: number, user: UpdateUserDto): Promise<User> {
    const updateUser = await this.userModel.findByPk(id);
    const keys = Object.keys(user);
    keys.forEach((key) => {
      updateUser[key] = user[key];
    });
    return updateUser.save();
  }

  async updateStatus(id: number, status: number): Promise<User> {
    const updateUser = await this.userModel.findByPk(id);
    updateUser.status = status;
    return updateUser.save();
  }

  async updatePassword(id: number, password: string): Promise<User> {
    const updateUser = await this.userModel.findByPk(id);
    updateUser.password = await bcrypt.hash(password, 10);
    return updateUser.save();
  }
}
