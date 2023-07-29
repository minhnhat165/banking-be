import { DatabaseModule } from 'src/database/database.module';
import { Module } from '@nestjs/common';
import { TermsController } from './terms.controller';
import { TermsService } from './terms.service';
import { termsProviders } from './terms.provider';

@Module({
  imports: [DatabaseModule],
  providers: [TermsService, ...termsProviders],
  controllers: [TermsController],
  exports: [TermsService],
})
export class TermsModule {}
