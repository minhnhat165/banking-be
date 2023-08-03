import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Customer } from './customer.model';
import { Response } from 'src/common/types/responses';
import { Pagination } from 'src/common/dto/pagination';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParams,
  ): Promise<Response<Pagination<Customer>>> {
    const data = await this.customersService.findAll(paginationParams);
    return {
      message: 'Customers have been found successfully',
      data: data,
    };
  }
  @Get('pin/:pin')
  async findByPin(@Param('pin') pin: string): Promise<Response<Customer>> {
    const data = await this.customersService.findOneByPin(pin);
    return {
      message: 'Customers have been found successfully',
      data: data,
    };
  }

  @Post()
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<Response<Customer>> {
    const newCustomer = await this.customersService.create(createCustomerDto);
    return {
      message: 'Customer has been created successfully',
      data: newCustomer,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateCustomerDto: Partial<CreateCustomerDto>,
  ): Promise<Response<Customer>> {
    const customer = await this.customersService.update(id, updateCustomerDto);
    return {
      message: 'Customer has been updated successfully',
      data: customer,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<Response<Customer>> {
    const customer = await this.customersService.delete(id);
    return {
      message: 'Customer has been deleted successfully',
      data: customer,
    };
  }
}
