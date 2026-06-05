import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

describe('TasksController', () => {
  let controller: TasksController;

  const mockTask = {
    id: 1,
    name: 'Test Task',
    email: 'test@test.com',
    age: 25,
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTasksService = {
    getTasks: jest.fn(),
    getTaskById: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
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
    it('should return an array of tasks', async () => {
      mockTasksService.getTasks.mockResolvedValue([mockTask]);

      const result = await controller.getAllTasks();

      expect(result).toEqual([mockTask]);
      expect(mockTasksService.getTasks).toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    it('should return a single task', async () => {
      mockTasksService.getTaskById.mockResolvedValue(mockTask);

      const result = await controller.getTaskById(1);

      expect(result).toEqual(mockTask);
      expect(mockTasksService.getTaskById).toHaveBeenCalledWith(1);
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const createDto: CreateTaskDto = {
        name: 'New Task',
        email: 'new@test.com',
        age: 30,
      };
      mockTasksService.createTask.mockResolvedValue({ ...createDto, id: 2 });

      const result = await controller.createTask(createDto);

      expect(result).toHaveProperty('id', 2);
      expect(mockTasksService.createTask).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateTask', () => {
    it('should update a task', async () => {
      const updateDto: UpdateTaskDto = { name: 'Updated Task' };
      mockTasksService.updateTask.mockResolvedValue({
        ...mockTask,
        ...updateDto,
      });

      const result = await controller.updateTask(1, updateDto);

      expect(result).toHaveProperty('name', 'Updated Task');
      expect(mockTasksService.updateTask).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      mockTasksService.deleteTask.mockResolvedValue(undefined);

      await controller.deleteTask(1);

      expect(mockTasksService.deleteTask).toHaveBeenCalledWith(1);
    });
  });
});
