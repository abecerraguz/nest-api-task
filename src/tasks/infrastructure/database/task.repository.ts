import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskRepositoryPort, TaskStatus } from 'tasks/domain';
import { TaskOrmEntity } from './task.orm-entity';

@Injectable()
export class TaskRepository implements TaskRepositoryPort {
  constructor(
    @InjectRepository(TaskOrmEntity)
    private readonly repository: Repository<TaskOrmEntity>,
  ) {}

  async findAll(status?: TaskStatus): Promise<Task[]> {
    if (status) {
      const ormEntities = await this.repository.find({
        where: { status },
        order: { priority: 'DESC', createdAt: 'DESC' },
      });
      return ormEntities.map((entity) => this.toDomain(entity));
    }

    const ormEntities = await this.repository.find({
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
    return ormEntities.map((entity) => this.toDomain(entity));
  }

  async findById(id: number): Promise<Task | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async save(task: Partial<Task>): Promise<Task> {
    const ormEntity = this.repository.create({
      title: task.title!,
      description: task.description ?? null,
      status: task.status ?? TaskStatus.PENDING,
      priority: task.priority ?? 1,
    });

    const savedEntity = await this.repository.save(ormEntity);
    return this.toDomain(savedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async countByStatus(status: TaskStatus): Promise<number> {
    return this.repository.count({ where: { status } });
  }

  async countAll(): Promise<number> {
    return this.repository.count();
  }

  private toDomain(orm: TaskOrmEntity): Task {
    return new Task(
      orm.id,
      orm.title,
      orm.description,
      orm.status,
      orm.priority,
      orm.createdAt,
      orm.updatedAt,
    );
  }
}