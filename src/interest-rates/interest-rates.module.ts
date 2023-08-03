import { Module, forwardRef } from '@nestjs/common';

import { AccountsModule } from 'src/accounts/accounts.module';
import { DatabaseModule } from 'src/database/database.module';
import { InterestRatesController } from './interest-rates.controller';
import { InterestRatesService } from './interest-rates.service';
import { interestRatesProviders } from './interest-rates.provider';

@Module({
  imports: [DatabaseModule, forwardRef(() => AccountsModule)],
  providers: [InterestRatesService, ...interestRatesProviders],
  controllers: [InterestRatesController],
  exports: [InterestRatesService],
})
export class InterestRatesModule {}
