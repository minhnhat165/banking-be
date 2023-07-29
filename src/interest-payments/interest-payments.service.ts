import { Inject, Injectable } from '@nestjs/common';
import { InterestPayment } from './interest-payment.model';

@Injectable()
export class InterestPaymentsService {
  constructor(
    @Inject('InterestPaymentRepository')
    private readonly interestPaymentModel: typeof InterestPayment,
  ) {}
  async findAll(): Promise<InterestPayment[]> {
    return this.interestPaymentModel.findAll();
  }
}
