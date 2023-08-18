import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { CustomersModule } from 'src/customers/customers.module';
import { DatabaseModule } from 'src/database/database.module';
import { InterestRatesModule } from 'src/interest-rates/interest-rates.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { Module } from '@nestjs/common';
import { TermsModule } from 'src/terms/terms.module';
import { TransactionDetailsModule } from 'src/transaction-details/transaction-details.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { accountsProviders } from './accounts.providers';

@Module({
  imports: [
    DatabaseModule,
    MailerModule,
    CustomersModule,
    TransactionsModule,
    InterestRatesModule,
    TransactionDetailsModule,
    TermsModule,
  ],
  providers: [AccountsService, ...accountsProviders],
  controllers: [AccountsController],
  exports: [AccountsService],
})
export class AccountsModule {}
