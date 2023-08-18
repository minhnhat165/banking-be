import { Provider } from '@nestjs/common';
import { TransactionDetail } from './transaction-detail.model';

export const transactionDetailsProviders: Provider[] = [
  {
    provide: 'TransactionDetailRepository',
    useValue: TransactionDetail,
  },
];
