import { DatabaseModule } from 'src/database/database.module';
import { InterestRatesController } from './interest-rates.controller';
import { InterestRatesService } from './interest-rates.service';
import { Module } from '@nestjs/common';
import { interestRatesProviders } from './interest-rates.provider';

@Module({
  imports: [DatabaseModule],
  providers: [InterestRatesService, ...interestRatesProviders],
  controllers: [InterestRatesController],
  exports: [InterestRatesService],
})
export class InterestRatesModule {}
