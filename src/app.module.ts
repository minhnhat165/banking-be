import { AccountsModule } from './accounts/accounts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CustomersModule } from './customers/customers.module';
import { DatabaseModule } from './database/database.module';
import { InterestPaymentsModule } from './interest-payments/interest-payments.module';
import { InterestRatesModule } from './interest-rates/interest-rates.module';
import { MailerModule } from './mailer/mailer.module';
import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { RolloversModule } from './rollovers/rollovers.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TermsModule } from './terms/terms.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';
import { UserPermissionsModule } from './user-permissions/user-permissions.module';
import configuration from './common/constant/env';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({
      load: [configuration],
    }),
    MailerModule,
    ProductsModule,
    TermsModule,
    RolloversModule,
    InterestPaymentsModule,
    CustomersModule,
    InterestRatesModule,
    AccountsModule,
    TransactionsModule,
    ScheduleModule.forRoot(),
    UserPermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
