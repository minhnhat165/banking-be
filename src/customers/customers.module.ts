import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { DatabaseModule } from 'src/database/database.module';
import { Module } from '@nestjs/common';
import { customersProviders } from './customers.provider';

@Module({
  imports: [DatabaseModule],
  providers: [CustomersService, ...customersProviders],
  controllers: [CustomersController],
  exports: [CustomersService],
})
export class CustomersModule {}
