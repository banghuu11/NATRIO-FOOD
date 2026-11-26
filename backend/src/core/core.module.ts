import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { NotificationsService } from './notifications.service';
import { UploadsController } from './uploads.controller';

@Global()
@Module({
  controllers: [UploadsController],
  providers: [MailService, NotificationsService],
  exports: [MailService, NotificationsService],
})
export class CoreModule {}
