import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Req } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { LogService } from '../log/log.service';

@Controller('task-items')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly logService: LogService,
  ) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.taskService.create(createTaskDto, userId).then(async (res) => {
      await this.logService.logAction(
        'Criação',
        `Criou tarefa: ${res.titulo}`,
        userId,
        'Tarefa',
      );
      return res;
    });
  }

  @Get()
  findAll() {
    return this.taskService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: any,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.userId;
    return this.taskService.update(id, updateTaskDto).then(async (res) => {
      await this.logService.logAction(
        'Atualização',
        `Atualizou tarefa: ${res.titulo}`,
        userId,
        'Tarefa',
      );
      return res;
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    return this.taskService.remove(id).then(async (res) => {
      await this.logService.logAction(
        'Exclusão',
        `Excluiu tarefa: ${res.titulo}`,
        userId,
        'Tarefa',
      );
      return res;
    });
  }

  @Post(':id/move')
  moveTask(
    @Param('id', ParseIntPipe) id: number,
    @Body('newStatusId', ParseIntPipe) newStatusId: number,
    @Body('newOrder', ParseIntPipe) newOrder: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.userId;
    return this.taskService.moveTask(id, newStatusId, newOrder).then(async (res) => {
      await this.logService.logAction(
        'Movimentação',
        `Moveu tarefa: ${res.titulo} para status ${newStatusId}`,
        userId,
        'Tarefa',
      );
      return res;
    });
  }
}
