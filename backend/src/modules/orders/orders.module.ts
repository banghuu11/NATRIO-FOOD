import { Global, Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderLifecycleService } from './order-lifecycle.service';
import { CartsModule } from '../carts/carts.module';
import { PaymentsService } from '../payments/payments.service';
import { PaymentsController } from '../payments/payments.controller';
import { OrdersCron } from './orders.cron';

@Global()
@Module({
  imports: [CartsModule],
  controllers: [OrdersController, PaymentsController],
  providers: [OrdersService, OrderLifecycleService, PaymentsService, OrdersCron],
  exports: [OrdersService, OrderLifecycleService, PaymentsService],
})
export class OrdersModule {}
