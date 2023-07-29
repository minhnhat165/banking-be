import { InterestRate } from './interest-rate.model';
import { Provider } from '@nestjs/common';

export const interestRatesProviders: Provider[] = [
  {
    provide: 'InterestRateRepository',
    useValue: InterestRate,
  },
];
