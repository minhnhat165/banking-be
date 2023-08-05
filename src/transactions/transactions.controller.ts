import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Response } from 'src/common/types/responses';
import { Pagination } from 'src/common/dto/pagination';
import { Transaction } from './transaction.model';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParams,
  ): Promise<Response<Pagination<Transaction>>> {
    const data = await this.transactionsService.findAll(paginationParams);
    return {
      message: 'success',
      data: data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Get('overview')
  async getOverview(): Promise<Response<any>> {
    const data = await this.transactionsService.getOverviews();
    return {
      message: 'Success',
      data: data,
    };
  }
}
