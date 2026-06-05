import { TaskStatus } from '../../domain/task-status.enum';
import { Task } from '../../domain/task.entity';

export interface TaskRepositoryPort {
  findAll(status?: TaskStatus): Promise<Task[]>;
  findById(id: number): Promise<Task | null>;
  save(task: Partial<Task>): Promise<Task>;
  delete(id: number): Promise<void>;
  countByStatus(status: TaskStatus): Promise<number>;
  countAll(): Promise<number>;
}