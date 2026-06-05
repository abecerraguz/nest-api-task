import { NotFoundException } from '@nestjs/common';
import { TaskRepositoryPort, TaskStatus } from 'tasks/domain';
import { GetTaskByIdUseCase } from './get-task-by-id.use-case';

describe('GetTaskByIdUseCase', () => {
  let useCase: GetTaskByIdUseCase;
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
    useCase = new GetTaskByIdUseCase(mockRepository);
  });

  it('should return the task if it exists', async () => {
    const mockTask = {
      id: 1,
      title: 'Test Task',
      description: null,
      status: TaskStatus.PENDING,
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockRepository.findById.mockResolvedValue(mockTask as any);

    const result = await useCase.execute(1);

    expect(result).toEqual(mockTask);
    expect(mockRepository.findById).toHaveBeenCalledWith(1);
  });

  it('should throw NotFoundException if task does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
    expect(mockRepository.findById).toHaveBeenCalledWith(999);
  });

  it('should call findById with correct id', async () => {
    mockRepository.findById.mockResolvedValue(null);

    try {
      await useCase.execute(42);
    } catch {
      // expected to throw
    }

    expect(mockRepository.findById).toHaveBeenCalledWith(42);
  });
});