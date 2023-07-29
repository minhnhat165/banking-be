import { Customer } from './customer.model';
import { Provider } from '@nestjs/common';

export const customersProviders: Provider[] = [
  {
    provide: 'CustomerRepository',
    useValue: Customer,
  },
];
