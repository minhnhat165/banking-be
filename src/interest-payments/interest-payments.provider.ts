import { InterestPayment } from './interest-payment.model';
import { Provider } from '@nestjs/common';

export const interestPaymentsProviders: Provider[] = [
  {
    provide: 'InterestPaymentRepository',
    useValue: InterestPayment,
  },
];
