import { Global, Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { StockService } from './stock.service';

@Global()
@Module({
  controllers: [ProductsController],
  providers: [ProductsService, StockService],
  exports: [ProductsService, StockService],
})
export class ProductsModule {}
