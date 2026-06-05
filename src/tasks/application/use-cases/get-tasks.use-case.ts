import { TaskRepositoryPort, TaskStatus, Task } from 'tasks/domain';

export class GetTasksUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(status?: TaskStatus): Promise<Task[]> {
    return this.taskRepository.findAll(status);
  }
}