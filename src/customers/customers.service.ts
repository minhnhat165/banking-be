import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Customer } from './customer.model';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Pagination } from 'src/common/dto/pagination';
import { Op } from 'sequelize';
import * as moment from 'moment';

@Injectable()
export class CustomersService {
  constructor(
    @Inject('CustomerRepository')
    private readonly customerModel: typeof Customer,
  ) {}

  async findAll(
    paginationParams: PaginationParams,
  ): Promise<Pagination<Customer>> {
    const { page = 0, limit = 10, ...filter } = paginationParams;
    const { rows, count } = await this.customerModel.findAndCountAll({
      offset: page * limit,
      limit,
      where: filter,
      order: [['id', 'DESC']],
    });
    return {
      items: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerModel.findByPk(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async findOneByEmail(email: string): Promise<Customer> {
    return await this.customerModel.findOne({
      where: { email },
    });
  }

  async findOneByPhone(phone: string): Promise<Customer> {
    return await this.customerModel.findOne({
      where: { phone },
    });
  }

  async findOneByPin(pin: string): Promise<Customer> {
    return await this.customerModel.findOne({
      where: { pin },
    });
  }

  async create(customer: CreateCustomerDto): Promise<Customer> {
    try {
      const newCustomer = new Customer();
      newCustomer.email = customer.email;
      newCustomer.firstName = customer.firstName;
      newCustomer.lastName = customer.lastName;
      newCustomer.dob = customer.dob;
      newCustomer.phone = customer.phone;
      newCustomer.address = customer.address;
      newCustomer.pin = customer.pin;
      newCustomer.gender = customer.gender;
      return await newCustomer.save();
    } catch (error) {
      const errorKey = error['errors'][0].validatorKey;
      if (errorKey === 'not_unique') {
        throw new ConflictException('Personal ID Number has been used');
      }
      throw new Error(error);
    }
  }

  async update(
    id: number,
    customer: Partial<CreateCustomerDto>,
  ): Promise<Customer> {
    try {
      const toUpdate = await this.findOne(id);
      return await toUpdate.update(customer);
    } catch (error) {
      const errorKey = error['errors'][0].validatorKey;
      if (errorKey === 'not_unique') {
        throw new ConflictException('Personal ID Number has been used');
      }
      throw new Error(error);
    }
  }

  async delete(id: number): Promise<Customer> {
    try {
      const toDelete = await this.findOne(id);
      await toDelete.destroy();
      return toDelete;
    } catch (error) {
      const { message } = error;
      if (message.includes('FK')) {
        throw new BadRequestException(
          'Customer cannot be deleted because it is related to other data',
        );
      }
      throw new Error(message);
    }
  }

  async getOverview(): Promise<any> {
    const total = await this.customerModel.count();
    const totalLastMonth = await this.customerModel.count({
      where: {
        createdDate: {
          [Op.gte]: moment().subtract(1, 'months').startOf('month').toDate(),
          [Op.lte]: moment().subtract(1, 'months').endOf('month').toDate(),
        },
      },
    });
    const totalThisMonth = await this.customerModel.count({
      where: {
        createdDate: {
          [Op.gte]: moment().startOf('month').toDate(),
        },
      },
    });

    if (totalLastMonth - totalThisMonth === 0) {
      return {
        total,
        percent: 0,
        totalLastMonth,
        totalThisMonth,
        status: 0,
      };
    }

    if (totalLastMonth === 0) {
      return {
        total,
        percent: 100,
        totalLastMonth,
        totalThisMonth,
        status: 1,
      };
    }

    if (totalThisMonth === 0) {
      return {
        total,
        percent: -100,
        totalLastMonth,
        totalThisMonth,
        status: -1,
      };
    }

    const percent = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;
    return {
      total,
      percent,
      totalLastMonth,
      totalThisMonth,
      status: percent > 0 ? 1 : -1,
    };
  }
}
