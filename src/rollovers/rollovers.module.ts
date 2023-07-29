import { DatabaseModule } from 'src/database/database.module';
import { Module } from '@nestjs/common';
import { RolloversController } from './rollovers.controller';
import { RolloversService } from './rollovers.service';
import { rolloversProviders } from './rollovers.provider';

@Module({
  imports: [DatabaseModule],
  providers: [RolloversService, ...rolloversProviders],
  controllers: [RolloversController],
  exports: [RolloversService],
})
export class RolloversModule {}
