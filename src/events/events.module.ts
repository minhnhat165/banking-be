import { EventsGateway } from './events.gateway';
import { Module } from '@nestjs/common';
import { UserPermissionsModule } from 'src/user-permissions/user-permissions.module';

@Module({})
export class EventsModule {
  imports: [UserPermissionsModule];
  providers: [EventsGateway];
  exports: [EventsGateway];
}
