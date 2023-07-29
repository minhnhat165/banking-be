import { DatabaseModule } from 'src/database/database.module';
import { InterestPaymentsController } from './interest-payments.controller';
import { InterestPaymentsService } from './interest-payments.service';
import { Module } from '@nestjs/common';
import { interestPaymentsProviders } from './interest-payments.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [InterestPaymentsController],
  providers: [InterestPaymentsService, ...interestPaymentsProviders],
  exports: [InterestPaymentsService],
})
export class InterestPaymentsModule {}
