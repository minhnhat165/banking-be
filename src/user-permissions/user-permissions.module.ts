import { DatabaseModule } from 'src/database/database.module';
import { Module } from '@nestjs/common';
import { UserPermissionsController } from './user-permissions.controller';
import { UserPermissionsService } from './user-permissions.service';
import { userPermissionProviders } from './user-permission.provider';

@Module({
  imports: [DatabaseModule],
  providers: [UserPermissionsService, ...userPermissionProviders],
  controllers: [UserPermissionsController],
  exports: [UserPermissionsService],
})
export class UserPermissionsModule {}
