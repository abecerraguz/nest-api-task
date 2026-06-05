import { BadRequestException } from '@nestjs/common';
import { TaskStatus } from './task-status.enum';

export class Task {
  constructor(
    public readonly id: number,
    public title: string,
    public description: string | null,
    public status: TaskStatus,
    public priority: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  changeStatus(newStatus: TaskStatus): void {
    if (this.status === TaskStatus.COMPLETED && newStatus === TaskStatus.PENDING) {
      throw new BadRequestException(
        'No se puede cambiar de COMPLETED a PENDING directamente',
      );
    }
    this.status = newStatus;
  }

  updateTitle(newTitle: string): void {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      throw new BadRequestException('El título no puede estar vacío');
    }
    this.title = trimmedTitle;
  }

  isCompleted(): boolean {
    return this.status === TaskStatus.COMPLETED;
  }

  isHighPriority(): boolean {
    return this.priority >= 4;
  }

  static create(
    title: string,
    description?: string,
    priority?: number,
  ): Task {
    const now = new Date();
    return new Task(
      0,
      title.trim(),
      description ?? null,
      TaskStatus.PENDING,
      priority ?? 1,
      now,
      now,
    );
  }
}