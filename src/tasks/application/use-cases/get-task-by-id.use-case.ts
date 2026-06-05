import { NotFoundException } from '@nestjs/common';
import { TaskRepositoryPort } from 'tasks/domain';

export class GetTaskByIdUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(id: number) {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }
    return task;
  }
}