import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { MailerModule } from './mailer/mailer.module';
import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { RolloversModule } from './rollovers/rollovers.module';
import { TermsModule } from './terms/terms.module';
import { UsersModule } from './users/users.module';
import { InterestPaymentsModule } from './interest-payments/interest-payments.module';
import { CustomersModule } from './customers/customers.module';
import { InterestRatesModule } from './interest-rates/interest-rates.module';
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
