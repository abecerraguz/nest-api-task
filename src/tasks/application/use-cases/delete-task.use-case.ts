import { NotFoundException } from '@nestjs/common';
import { TaskRepositoryPort } from 'tasks/domain';

export class DeleteTaskUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(id: number): Promise<void> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }
    await this.taskRepository.delete(id);
  }
}