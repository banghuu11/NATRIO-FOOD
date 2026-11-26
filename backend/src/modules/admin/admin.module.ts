import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminCustomersController } from './admin-customers.controller';
import { AdminInventoryController } from './admin-inventory.controller';
import { AdminPromotionsController } from './admin-promotions.controller';
import { AdminContentController } from './admin-content.controller';
import { AdminStaffController } from './admin-staff.controller';

/** Back-office API. Every route requires a permission checked by the global RolesGuard. */
@Module({
  controllers: [
    AdminDashboardController,
    AdminCatalogController,
    AdminOrdersController,
    AdminCustomersController,
    AdminInventoryController,
    AdminPromotionsController,
    AdminContentController,
    AdminStaffController,
  ],
  providers: [AdminCatalogService],
})
export class AdminModule {}
