import { Account } from './account.model';
import { Provider } from '@nestjs/common';

export const accountsProviders: Provider[] = [
  {
    provide: 'AccountRepository',
    useValue: Account,
  },
];
