import { DatabaseModule } from 'src/database/database.module';
import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { transactionsProviders } from './transactions.provider';

@Module({
  imports: [DatabaseModule],
  providers: [TransactionsService, ...transactionsProviders],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
