import { Module } from '@nestjs/common';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StatusController, TaskController],
  providers: [StatusService, TaskService],
  exports: [StatusService, TaskService],
})
export class TaskManagementModule {}
