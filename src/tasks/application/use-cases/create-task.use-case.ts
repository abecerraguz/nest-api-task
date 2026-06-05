import { Task, TaskRepositoryPort, TaskStatus } from 'tasks/domain';

export interface CreateTaskCommand {
  title: string;
  description?: string;
  priority?: number;
}

export class CreateTaskUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(command: CreateTaskCommand): Promise<Task> {
    const priority = this.calculatePriority(command.title, command.priority);

    const task = Task.create(command.title, command.description, priority);

    return this.taskRepository.save({
      title: task.title,
      description: task.description,
      status: TaskStatus.PENDING,
      priority: task.priority,
    });
  }

  private calculatePriority(title: string, providedPriority?: number): number {
    const containsUrgente = /urgente/i.test(title);
    const basePriority = providedPriority ?? 1;

    if (containsUrgente) {
      return Math.max(basePriority, 4);
    }

    return basePriority;
  }
}