import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async getTasks() {
    return this.taskRepository.find();
  }

  async getTaskById(id: number) {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async createTask(dto: CreateTaskDto) {
    const task = this.taskRepository.create(dto);
    return this.taskRepository.save(task);
  }

  async updateTask(id: number, dto: UpdateTaskDto) {
    const task = await this.getTaskById(id);
    return this.taskRepository.save({ ...task, ...dto });
  }

  async deleteTask(id: number) {
    const task = await this.getTaskById(id);
    await this.taskRepository.remove(task);
  }
}
