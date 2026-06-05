import { TaskRepositoryPort, TaskStatus } from 'tasks/domain';

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export class GetTaskStatsUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(): Promise<TaskStats> {
    const [total, pending, inProgress, completed] = await Promise.all([
      this.taskRepository.countAll(),
      this.taskRepository.countByStatus(TaskStatus.PENDING),
      this.taskRepository.countByStatus(TaskStatus.IN_PROGRESS),
      this.taskRepository.countByStatus(TaskStatus.COMPLETED),
    ]);

    return { total, pending, inProgress, completed };
  }
}