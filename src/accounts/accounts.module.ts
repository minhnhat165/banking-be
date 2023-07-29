import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { CustomersModule } from 'src/customers/customers.module';
import { DatabaseModule } from 'src/database/database.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { Module } from '@nestjs/common';
import { accountsProviders } from './accounts.providers';

@Module({
  imports: [DatabaseModule, MailerModule, CustomersModule],
  providers: [AccountsService, ...accountsProviders],
  controllers: [AccountsController],
  exports: [AccountsService],
})
export class AccountsModule {}
