import { Controller, Get } from '@nestjs/common';

import { InterestPayment } from './interest-payment.model';
import { InterestPaymentsService } from './interest-payments.service';
import { Response } from 'src/common/types/responses';

@Controller('interest-payments')
export class InterestPaymentsController {
  constructor(
    private readonly interestPaymentsService: InterestPaymentsService,
  ) {}

  @Get()
  async findAll(): Promise<Response<InterestPayment[]>> {
    const InterestPayments = await this.interestPaymentsService.findAll();
    return {
      message: 'InterestPayments retrieved successfully',
      data: InterestPayments,
    };
  }
}
