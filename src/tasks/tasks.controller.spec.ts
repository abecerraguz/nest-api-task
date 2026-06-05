/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/task.dto';
import { UpdateTaskDto } from './dto/task.dto';
import { TaskStatus } from './entities/task.entity';

describe('TasksController', () => {
  let controller: TasksController;

  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'Test description',
    status: TaskStatus.PENDING,
    priority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTasksService = {
    getTasks: jest.fn().mockResolvedValue([mockTask]),
    getTaskById: jest.fn().mockResolvedValue(mockTask),
    createTask: jest.fn().mockResolvedValue(mockTask),
    updateTask: jest.fn().mockResolvedValue(mockTask),
    deleteTask: jest.fn().mockResolvedValue(undefined),
    getTaskStats: jest.fn().mockResolvedValue({
      total: 1,
      pending: 1,
      inProgress: 0,
      completed: 0,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllTasks', () => {
    it('should return all tasks', async () => {
      const result = await controller.getAllTasks();
      expect(result).toBeDefined();
    });
  });

  describe('getTaskStats', () => {
    it('should return task statistics', async () => {
      const result = await controller.getTaskStats();
      expect(result).toBeDefined();
      expect(mockTasksService.getTaskStats).toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    it('should return a single task', async () => {
      const result = await controller.getTaskById(1);
      expect(result).toBeDefined();
      expect(mockTasksService.getTaskById).toHaveBeenCalledWith(1);
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const dto: CreateTaskDto = { title: 'New Task', description: 'New', priority: 2 };
      const result = await controller.createTask(dto);
      expect(result).toBeDefined();
      expect(mockTasksService.createTask).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateTask', () => {
    it('should update a task', async () => {
      const dto: UpdateTaskDto = { title: 'Updated' };
      const result = await controller.updateTask(1, dto);
      expect(result).toBeDefined();
      expect(mockTasksService.updateTask).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      await controller.deleteTask(1);
      expect(mockTasksService.deleteTask).toHaveBeenCalledWith(1);
    });
  });
});
