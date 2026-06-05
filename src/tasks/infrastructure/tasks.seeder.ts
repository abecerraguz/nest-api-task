import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskStatus } from 'tasks/domain/task-status.enum';
import { TaskOrmEntity } from './database/task.orm-entity';

@Injectable()
export class TasksSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(TaskOrmEntity)
    private readonly taskRepository: Repository<TaskOrmEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.taskRepository.count();
    if (count === 0) {
      await this.seed();
    }
  }

  async seed() {
    const tasks = [
      {
        title: 'Configurar proyecto NestJS',
        description: 'Inicializar el proyecto con todas las dependencias',
        status: TaskStatus.COMPLETED,
        priority: 5,
      },
      {
        title: 'Diseñar base de datos',
        description: 'Crear el modelo de tareas',
        status: TaskStatus.COMPLETED,
        priority: 5,
      },
      {
        title: 'Implementar CRUD de tareas',
        description: 'Crear controller, service y endpoints',
        status: TaskStatus.COMPLETED,
        priority: 4,
      },
      {
        title: 'Agregar validaciones',
        description: 'Implementar DTOs con class-validator',
        status: TaskStatus.COMPLETED,
        priority: 4,
      },
      {
        title: 'Configurar Swagger',
        description: 'Documentar la API automáticamente',
        status: TaskStatus.COMPLETED,
        priority: 3,
      },
      {
        title: 'Crear tests unitarios',
        description: 'Escribir tests para service y controller',
        status: TaskStatus.IN_PROGRESS,
        priority: 4,
      },
      {
        title: 'Implementar autenticación JWT',
        description: 'Agregar @nestjs/passport y @nestjs/jwt',
        status: TaskStatus.PENDING,
        priority: 5,
      },
      {
        title: 'Configurar CORS',
        description: 'Habilitar CORS para frontend',
        status: TaskStatus.COMPLETED,
        priority: 2,
      },
      {
        title: 'Deploy en Railway',
        description: 'Desplegar la API en producción',
        status: TaskStatus.PENDING,
        priority: 3,
      },
      {
        title: 'Agregar paginación',
        description: 'Implementar paginación en endpoints',
        status: TaskStatus.PENDING,
        priority: 3,
      },
      {
        title: 'Configurar variables de entorno',
        description: 'Usar @nestjs/config con dotenv',
        status: TaskStatus.COMPLETED,
        priority: 3,
      },
      {
        title: 'Agregar logging',
        description: 'Implementar sistema de logs',
        status: TaskStatus.PENDING,
        priority: 2,
      },
    ];

    await this.taskRepository.save(tasks);
    console.log('✅ Seed de tareas completado: 12 tareas creadas');
  }
}