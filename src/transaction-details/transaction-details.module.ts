import { DatabaseModule } from 'src/database/database.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { Module } from '@nestjs/common';
import { TransactionDetailsService } from './transaction-details.service';
import { transactionDetailsProviders } from './transaction-details.provider';

@Module({
  imports: [DatabaseModule, MailerModule],
  providers: [TransactionDetailsService, ...transactionDetailsProviders],
  exports: [TransactionDetailsService],
})
export class TransactionDetailsModule {}
