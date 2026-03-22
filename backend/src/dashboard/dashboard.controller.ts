import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  getMetrics(@Query('filialId') filialId: string) {
    return this.dashboardService.getMetrics(filialId);
  }

  @Get('relatorios')
  getRelatorios(
    @Query('periodo') periodo: string,
    @Query('filialId') filialId: string,
  ) {
    return this.dashboardService.getRelatorios(periodo || 'mes', filialId);
  }
}
