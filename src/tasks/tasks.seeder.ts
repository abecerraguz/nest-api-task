import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';

@Injectable()
export class TasksSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
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
        description: 'Inicializar el proyecto con todas las dependencias necesarias',
        status: TaskStatus.COMPLETED,
        priority: 5,
      },
      {
        title: 'Diseñar base de datos',
        description: 'Crear el modelo de tareas con campos title, description, status y priority',
        status: TaskStatus.COMPLETED,
        priority: 5,
      },
      {
        title: 'Implementar CRUD de tareas',
        description: 'Crear controller, service y endpoints para el CRUD completo',
        status: TaskStatus.COMPLETED,
        priority: 4,
      },
      {
        title: 'Agregar validaciones',
        description: 'Implementar DTOs con class-validator para validar datos de entrada',
        status: TaskStatus.COMPLETED,
        priority: 4,
      },
      {
        title: 'Configurar Swagger',
        description: 'Documentar la API automáticamente con @nestjs/swagger',
        status: TaskStatus.COMPLETED,
        priority: 3,
      },
      {
        title: 'Crear tests unitarios',
        description: 'Escribir tests para service y controller usando Jest',
        status: TaskStatus.IN_PROGRESS,
        priority: 4,
      },
      {
        title: 'Implementar autenticación JWT',
        description: 'Agregar @nestjs/passport y @nestjs/jwt para autenticación',
        status: TaskStatus.PENDING,
        priority: 5,
      },
      {
        title: 'Configurar CORS',
        description: 'Habilitar CORS para permitir conexion desde frontend',
        status: TaskStatus.COMPLETED,
        priority: 2,
      },
      {
        title: 'Deploy en Railway',
        description: 'Desplegar la API en Railway con base de datos PostgreSQL',
        status: TaskStatus.PENDING,
        priority: 3,
      },
      {
        title: 'Agregar paginación',
        description: 'Implementar paginación en el endpoint GET /tasks',
        status: TaskStatus.PENDING,
        priority: 3,
      },
      {
        title: 'Configurar variables de entorno',
        description: 'Usar @nestjs/config con dotenv para configuración',
        status: TaskStatus.COMPLETED,
        priority: 3,
      },
      {
        title: 'Agregar logging',
        description: 'Implementar sistema de logs con Winston o NestJS Logger',
        status: TaskStatus.PENDING,
        priority: 2,
      },
    ];

    await this.taskRepository.save(tasks);
    console.log('✅ Seed de tareas completado: 12 tareas creadas');
  }
}
