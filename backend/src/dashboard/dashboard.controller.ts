import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('metrics')
  getMetrics() {
    return this.dashboardService.getMetrics();
  }

  @Get('relatorios')
  getRelatorios(@Query('periodo') periodo: string) {
    return this.dashboardService.getRelatorios(periodo || 'mes');
  }
}
