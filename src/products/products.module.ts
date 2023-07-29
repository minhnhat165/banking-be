import { DatabaseModule } from 'src/database/database.module';
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { productsProviders } from './products.provider';

@Module({
  imports: [DatabaseModule],
  providers: [ProductsService, ...productsProviders],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
