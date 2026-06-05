import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './entities/task.entity';

describe('TasksService', () => {
  let service: TasksService;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test description',
    status: TaskStatus.PENDING,
    priority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTasks', () => {
    it('should return all tasks', async () => {
      mockRepository.find.mockResolvedValue([mockTask]);

      const result = await service.getTasks();

      expect(result).toEqual([mockTask]);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should filter tasks by status', async () => {
      mockRepository.find.mockResolvedValue([mockTask]);

      const result = await service.getTasks(TaskStatus.PENDING);

      expect(result).toEqual([mockTask]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: TaskStatus.PENDING },
      });
    });
  });

  describe('getTaskById', () => {
    it('should return a single task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.getTaskById(1);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getTaskById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const dto = { title: 'New Task', description: 'New', priority: 2 };
      mockRepository.create.mockReturnValue({ ...dto, id: 2 });
      mockRepository.save.mockResolvedValue({ ...dto, id: 2 });

      const result = await service.createTask(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('id');
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue({ ...mockTask, title: 'Updated' });

      const result = await service.updateTask(1, { title: 'Updated' });

      expect(result).toHaveProperty('title', 'Updated');
    });
  });

  describe('deleteTask', () => {
    it('should delete an existing task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.remove.mockResolvedValue(mockTask);

      await service.deleteTask(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteTask(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTaskStats', () => {
    it('should return task statistics', async () => {
      mockRepository.count.mockResolvedValue(10);

      const result = await service.getTaskStats();

      expect(result).toEqual({
        total: 10,
        pending: 10,
        inProgress: 10,
        completed: 10,
      });
    });
  });
});
