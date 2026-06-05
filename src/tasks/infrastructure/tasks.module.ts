import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskOrmEntity } from './database/task.orm-entity';
import { TaskRepository } from './database/task.repository';
import { TasksController } from './http/tasks.controller';
import {
  GetTasksUseCase,
  GetTaskByIdUseCase,
  CreateTaskUseCase,
  UpdateTaskUseCase,
  DeleteTaskUseCase,
  GetTaskStatsUseCase,
} from 'tasks/application/use-cases';
import { TasksSeeder } from './tasks.seeder';

export const TASK_REPOSITORY = 'TASK_REPOSITORY';

@Module({
  imports: [TypeOrmModule.forFeature([TaskOrmEntity])],
  controllers: [TasksController],
  providers: [
    TaskRepository,
    {
      provide: TASK_REPOSITORY,
      useExisting: TaskRepository,
    },
    {
      provide: GetTasksUseCase,
      useFactory: (taskRepository: TaskRepository) =>
        new GetTasksUseCase(taskRepository),
      inject: [TASK_REPOSITORY],
    },
    {
      provide: GetTaskByIdUseCase,
      useFactory: (taskRepository: TaskRepository) =>
        new GetTaskByIdUseCase(taskRepository),
      inject: [TASK_REPOSITORY],
    },
    {
      provide: CreateTaskUseCase,
      useFactory: (taskRepository: TaskRepository) =>
        new CreateTaskUseCase(taskRepository),
      inject: [TASK_REPOSITORY],
    },
    {
      provide: UpdateTaskUseCase,
      useFactory: (taskRepository: TaskRepository) =>
        new UpdateTaskUseCase(taskRepository),
      inject: [TASK_REPOSITORY],
    },
    {
      provide: DeleteTaskUseCase,
      useFactory: (taskRepository: TaskRepository) =>
        new DeleteTaskUseCase(taskRepository),
      inject: [TASK_REPOSITORY],
    },
    {
      provide: GetTaskStatsUseCase,
      useFactory: (taskRepository: TaskRepository) =>
        new GetTaskStatsUseCase(taskRepository),
      inject: [TASK_REPOSITORY],
    },
    TasksSeeder,
  ],
})
export class TasksModule {}