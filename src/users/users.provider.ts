import { Provider } from '@nestjs/common';
import { User } from './user.model';

export const usersProviders: Provider[] = [
  {
    provide: 'UserRepository',
    useValue: User,
  },
];
