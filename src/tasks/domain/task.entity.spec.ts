import { BadRequestException } from '@nestjs/common';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';

describe('Task Entity', () => {
  const now = new Date();

  describe('changeStatus', () => {
    it('should allow valid status transitions', () => {
      const task = new Task(1, 'Test', null, TaskStatus.PENDING, 1, now, now);

      task.changeStatus(TaskStatus.IN_PROGRESS);
      expect(task.status).toBe(TaskStatus.IN_PROGRESS);

      task.changeStatus(TaskStatus.COMPLETED);
      expect(task.status).toBe(TaskStatus.COMPLETED);
    });

    it('should throw error when trying to go from COMPLETED to PENDING', () => {
      const task = new Task(1, 'Test', null, TaskStatus.COMPLETED, 1, now, now);

      expect(() => task.changeStatus(TaskStatus.PENDING)).toThrow(
        BadRequestException,
      );
      expect(task.status).toBe(TaskStatus.COMPLETED);
    });
  });

  describe('updateTitle', () => {
    it('should update title with valid string', () => {
      const task = new Task(1, 'Old Title', null, TaskStatus.PENDING, 1, now, now);

      task.updateTitle('New Title');
      expect(task.title).toBe('New Title');
    });

    it('should throw error with empty string', () => {
      const task = new Task(1, 'Test', null, TaskStatus.PENDING, 1, now, now);

      expect(() => task.updateTitle('')).toThrow(BadRequestException);
      expect(task.title).toBe('Test');
    });

    it('should throw error with whitespace-only string', () => {
      const task = new Task(1, 'Test', null, TaskStatus.PENDING, 1, now, now);

      expect(() => task.updateTitle('   ')).toThrow(BadRequestException);
      expect(task.title).toBe('Test');
    });

    it('should trim whitespace from title', () => {
      const task = new Task(1, 'Test', null, TaskStatus.PENDING, 1, now, now);

      task.updateTitle('  New Title  ');
      expect(task.title).toBe('New Title');
    });
  });

  describe('isHighPriority', () => {
    it('should return true for priority 4', () => {
      const task = new Task(1, 'Test', null, TaskStatus.PENDING, 4, now, now);
      expect(task.isHighPriority()).toBe(true);
    });

    it('should return true for priority 5', () => {
      const task = new Task(1, 'Test', null, TaskStatus.PENDING, 5, now, now);
      expect(task.isHighPriority()).toBe(true);
    });

    it('should return false for priority 3', () => {
      const task = new Task(1, 'Test', null, TaskStatus.PENDING, 3, now, now);
      expect(task.isHighPriority()).toBe(false);
    });

    it('should return false for priority 1', () => {
      const task = new Task(1, 'Test', null, TaskStatus.PENDING, 1, now, now);
      expect(task.isHighPriority()).toBe(false);
    });
  });

  describe('isCompleted', () => {
    it('should return true when status is COMPLETED', () => {
      const task = new Task(1, 'Test', null, TaskStatus.COMPLETED, 1, now, now);
      expect(task.isCompleted()).toBe(true);
    });

    it('should return false when status is not COMPLETED', () => {
      const task = new Task(1, 'Test', null, TaskStatus.PENDING, 1, now, now);
      expect(task.isCompleted()).toBe(false);
    });
  });

  describe('create', () => {
    it('should create a task with default values', () => {
      const task = Task.create('New Task');

      expect(task.id).toBe(0);
      expect(task.title).toBe('New Task');
      expect(task.description).toBeNull();
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.priority).toBe(1);
    });

    it('should create a task with provided values', () => {
      const task = Task.create('New Task', 'Description', 4);

      expect(task.title).toBe('New Task');
      expect(task.description).toBe('Description');
      expect(task.priority).toBe(4);
    });

    it('should trim title on creation', () => {
      const task = Task.create('  Trimmed Title  ');

      expect(task.title).toBe('Trimmed Title');
    });
  });
});