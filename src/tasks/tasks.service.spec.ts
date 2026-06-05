import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';

describe('TasksService', () => {
  let service: TasksService;

  const mockTask: Task = {
    id: 1,
    name: 'Test Task',
    email: 'test@test.com',
    age: 25,
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
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
    it('should return an array of tasks', async () => {
      const tasks = [mockTask];
      mockRepository.find.mockResolvedValue(tasks);

      const result = await service.getTasks();

      expect(result).toEqual(tasks);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    it('should return a single task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.getTaskById(1);

      expect(result).toEqual(mockTask);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getTaskById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const createDto: CreateTaskDto = {
        name: 'New Task',
        email: 'new@test.com',
        age: 30,
      };
      mockRepository.create.mockReturnValue({ ...createDto, id: 2 });
      mockRepository.save.mockResolvedValue({ ...createDto, id: 2 });

      const result = await service.createTask(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 2);
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const updateDto = { name: 'Updated Task' };
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue({ ...mockTask, ...updateDto });

      const result = await service.updateTask(1, updateDto);

      expect(result).toHaveProperty('name', 'Updated Task');
    });
  });

  describe('deleteTask', () => {
    it('should delete an existing task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.remove.mockResolvedValue(mockTask);

      await service.deleteTask(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteTask(999)).rejects.toThrow(NotFoundException);
    });
  });
});
