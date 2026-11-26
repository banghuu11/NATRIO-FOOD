import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/roles.decorator';
import { AppService } from './app.service';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get()
  getRoot() {
    return this.appService.getHealth();
  }
}

