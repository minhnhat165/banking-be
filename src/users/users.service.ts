import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
  constructor(
    @Inject('UserRepository')
    private readonly userModel: typeof User,
  ) {}

  async findAll(): Promise<User[]> {
    //find all users with role
    return this.userModel.findAll({
      include: ['role'],
    });
  }

  async findById(id: number): Promise<User> {
    return this.userModel.findByPk(id);
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({
      where: {
        email,
      },
    });
  }

  async create(user: CreateUserDto): Promise<User> {
    const isExist = await this.findByEmail(user.email);
    if (isExist) {
      throw new ConflictException('Email already exists');
    }
    const newUser = new User();
    newUser.username = user.username;
    newUser.email = user.email;
    newUser.password = await bcrypt.hash(user.password, 10);
    newUser.firstName = user.firstName;
    newUser.lastName = user.lastName;
    newUser.dob = user.dob;
    newUser.phone = user.phone;
    newUser.address = user.address;
    newUser.roleId = user.roleId;
    return newUser.save();
  }

  // Implement other CRUD operations as needed
}
