import {
  Controller,
  Get,
  Query,
  UseGuards,
  Body,
  Param,
  Patch,
} from '@nestjs/common';

import { InterestPayment } from './interest-payment.model';
import { InterestPaymentsService } from './interest-payments.service';
import { Response } from 'src/common/types/responses';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Pagination } from 'src/common/dto/pagination';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('interest-payments')
export class InterestPaymentsController {
  constructor(
    private readonly interestPaymentsService: InterestPaymentsService,
  ) {}

  @Get()
  async findAll(
    @Query() paginationParams: PaginationParams,
  ): Promise<Response<Pagination<InterestPayment>>> {
    const data = await this.interestPaymentsService.findAll(paginationParams);
    return {
      message: 'Products have been found successfully',
      data: data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Body()
    interestPayment: {
      description?: string;
    },
    @Param('id') id: number,
  ): Promise<Response<InterestPayment>> {
    const updatedInterestPayment = await this.interestPaymentsService.update(
      id,
      interestPayment.description,
    );
    return {
      message: 'InterestPayment has been updated successfully',
      data: updatedInterestPayment,
    };
  }
}
