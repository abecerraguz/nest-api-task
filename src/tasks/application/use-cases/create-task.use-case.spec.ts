import { TaskRepositoryPort, TaskStatus } from 'tasks/domain';
import { CreateTaskUseCase } from './create-task.use-case';

describe('CreateTaskUseCase', () => {
  let useCase: CreateTaskUseCase;
  let mockRepository: jest.Mocked<TaskRepositoryPort>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      countByStatus: jest.fn(),
      countAll: jest.fn(),
    };
    useCase = new CreateTaskUseCase(mockRepository);
  });

  it('should create task with default priority 1', async () => {
    mockRepository.save.mockResolvedValue({
      id: 1,
      title: 'New Task',
      description: null,
      status: TaskStatus.PENDING,
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await useCase.execute({ title: 'New Task' });

    expect(mockRepository.save).toHaveBeenCalledWith({
      title: 'New Task',
      description: null,
      status: TaskStatus.PENDING,
      priority: 1,
    });
    expect(result.priority).toBe(1);
  });

  it('should elevate priority to 4 if title contains "urgente"', async () => {
    mockRepository.save.mockResolvedValue({
      id: 1,
      title: 'Tarea urgente',
      description: null,
      status: TaskStatus.PENDING,
      priority: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await useCase.execute({ title: 'Tarea urgente', priority: 2 });

    expect(result.priority).toBe(4);
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 4 }),
    );
  });

  it('should elevate priority to 4 if title contains "URGENTE" (case insensitive)', async () => {
    mockRepository.save.mockResolvedValue({
      id: 1,
      title: 'URGENTE TASK',
      description: null,
      status: TaskStatus.PENDING,
      priority: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await useCase.execute({ title: 'URGENTE TASK' });

    expect(result.priority).toBe(4);
  });

  it('should keep priority 5 if already higher than 4', async () => {
    mockRepository.save.mockResolvedValue({
      id: 1,
      title: 'Tarea urgente',
      description: null,
      status: TaskStatus.PENDING,
      priority: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await useCase.execute({ title: 'Tarea urgente', priority: 5 });

    expect(result.priority).toBe(5);
  });

  it('should call save with PENDING status', async () => {
    mockRepository.save.mockResolvedValue({
      id: 1,
      title: 'Test',
      description: null,
      status: TaskStatus.PENDING,
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await useCase.execute({ title: 'Test' });

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: TaskStatus.PENDING }),
    );
  });
});