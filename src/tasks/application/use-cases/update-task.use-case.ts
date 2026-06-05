import { NotFoundException } from '@nestjs/common';
import { Task, TaskRepositoryPort, TaskStatus } from 'tasks/domain';

export interface UpdateTaskCommand {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: number;
}

export class UpdateTaskUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(id: number, command: UpdateTaskCommand): Promise<Task> {
    const existingTask = await this.taskRepository.findById(id);
    if (!existingTask) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }

    if (command.title !== undefined) {
      existingTask.updateTitle(command.title);
    }

    if (command.status !== undefined) {
      existingTask.changeStatus(command.status);
    }

    const updateData: Partial<Task> = {
      title: existingTask.title,
      status: existingTask.status,
    };

    if (command.description !== undefined) {
      updateData.description = command.description ?? null;
    }

    if (command.priority !== undefined) {
      updateData.priority = command.priority;
    }

    return this.taskRepository.save(updateData);
  }
}