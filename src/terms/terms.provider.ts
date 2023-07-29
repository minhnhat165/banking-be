import { Provider } from '@nestjs/common';
import { Term } from './terms.model';

export const termsProviders: Provider[] = [
  {
    provide: 'TermRepository',
    useValue: Term,
  },
];
