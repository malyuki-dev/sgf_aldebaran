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

  @Get('supervisor')
  getSupervisorOverview(@Query('filialId') filialId: string) {
    return this.dashboardService.getSupervisorOverview(filialId);
  }

  @Get('graficos-por-hora')
  getGraficosPorHora(
    @Query('periodo') periodo: string,
    @Query('filialId') filialId: string,
  ) {
    return this.dashboardService.getGraficosPorHora(periodo || 'dia', filialId);
  }

  @Get('operadores')
  getDesempenhoOperadores(
    @Query('periodo') periodo: string,
    @Query('filialId') filialId: string,
  ) {
    return this.dashboardService.getDesempenhoOperadores(periodo || 'dia', filialId);
  }

  @Get('meses-disponiveis')
  getMesesDisponiveis(@Query('filialId') filialId: string) {
    return this.dashboardService.getMesesDisponiveis(filialId);
  }

  @Get('fila-espera')
  getFilaEspera(@Query('filialId') filialId: string) {
    return this.dashboardService.getFilaEspera(filialId);
  }
}
