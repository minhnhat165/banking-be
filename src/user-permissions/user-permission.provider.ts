import { Provider } from '@nestjs/common';
import { UserPermission } from './user-permission.model';

export const userPermissionProviders: Provider[] = [
  {
    provide: 'UserPermissionRepository',
    useValue: UserPermission,
  },
];
