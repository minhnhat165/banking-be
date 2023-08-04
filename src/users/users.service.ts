import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import { USER } from 'src/common/constant/user';
import { Pagination } from 'src/common/dto/pagination';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { generateAvatar } from 'src/utils/generate-avatar';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.model';
@Injectable()
export class UsersService {
  constructor(
    @Inject('UserRepository')
    private readonly userModel: typeof User,
  ) {}

  async findAll(paginationParams: PaginationParams): Promise<Pagination<User>> {
    //find all users with role
    const { page = 0, limit = 10, ...filter } = paginationParams;
    const { rows, count } = await this.userModel.findAndCountAll({
      include: ['role'],
      limit,
      where: filter,
      offset: page * limit,
      order: [['id', 'DESC']],
    });
    return {
      items: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findById(id: number): Promise<User> {
    return this.userModel.findByPk(id, {
      include: ['permissions'],
    });
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
    if (user?.password) {
      newUser.password = await bcrypt.hash(user.password, 10);
    } else {
      const dob = moment(user.dob);
      const password =
        dob.get('date').toString() +
        dob.get('month').toString() +
        dob.get('year').toString();
      newUser.password = await bcrypt.hash(password, 10);
    }
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

  async delete(id: number): Promise<void> {
    const deleteUser = await this.userModel.findByPk(id);
    if (deleteUser.status !== USER.STATUS.INACTIVE) {
      throw new ForbiddenException('User can not delete');
    }
    deleteUser.destroy();
  }

  async lock(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id);
    user.status = USER.STATUS.LOCKED;
    return user.save();
  }

  async unlock(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id);
    user.status = USER.STATUS.ACTIVE;
    return user.save();
  }
}
