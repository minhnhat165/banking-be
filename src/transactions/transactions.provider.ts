import { Provider } from '@nestjs/common';
import { Transaction } from './transaction.model';

export const transactionsProviders: Provider[] = [
  {
    provide: 'TransactionRepository',
    useValue: Transaction,
  },
];
