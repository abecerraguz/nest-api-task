import { NotFoundException } from '@nestjs/common';
import { TaskRepositoryPort, TaskStatus } from 'tasks/domain';
import { DeleteTaskUseCase } from './delete-task.use-case';

describe('DeleteTaskUseCase', () => {
  let useCase: DeleteTaskUseCase;
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
    useCase = new DeleteTaskUseCase(mockRepository);
  });

  it('should call delete when task exists', async () => {
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
    mockRepository.delete.mockResolvedValue(undefined);

    await useCase.execute(1);

    expect(mockRepository.findById).toHaveBeenCalledWith(1);
    expect(mockRepository.delete).toHaveBeenCalledWith(1);
  });

  it('should throw NotFoundException if task does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it('should not call delete when task is not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    try {
      await useCase.execute(42);
    } catch {
      // expected to throw
    }

    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});