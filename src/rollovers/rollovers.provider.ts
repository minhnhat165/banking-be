import { Provider } from '@nestjs/common';
import { Rollover } from './rollover.model';

export const rolloversProviders: Provider[] = [
  {
    provide: 'RolloverRepository',
    useValue: Rollover,
  },
];
