import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Customer } from './customer.model';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Pagination } from 'src/common/dto/pagination';

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
        const errorMessage = error['errors'][0].message;
        throw new ConflictException(errorMessage);
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
        const errorMessage = error['errors'][0].message;
        throw new ConflictException(errorMessage);
      }
      throw new Error(error);
    }
  }

  async delete(id: number): Promise<Customer> {
    const toDelete = await this.findOne(id);
    await toDelete.destroy();
    return toDelete;
  }
}