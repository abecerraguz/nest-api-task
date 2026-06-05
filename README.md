# 🐣 Guía Completa de NestJS - Task Manager API 📚

> Aprende NestJS desde cero construyendo un administrador de tareas.
> Todo lo que necesitas saber en un solo lugar.

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Instalación y setup](#instalación-y-setup)
3. [Arquitectura básica](#arquitectura-básica)
4. [Crear el proyecto paso a paso](#crear-el-proyecto-paso-a-paso)
5. [Tests unitarios explicados](#tests-unitarios-explicados)
6. [Conceptos clave de NestJS](#conceptos-clave-de-nestjs)
7. [Referencia rápida](#referencia-rápida)

---

## Introducción

### ¿Qué es NestJS?

**NestJS** es un framework de Node.js para construir aplicaciones backend escalables.

```
EXPRESS vs NESTJS
─────────────────

Express:                    NestJS:
┌─────────────┐            ┌─────────────┐
│"Tú decides  │            │"NestJS tiene │
│cómo         │            │ estructura  │
│organizar"   │            │por defecto"  │
│             │            │             │
│• ¿Dónde     │            │• Controller  │
│  pongo la   │            │• Service     │
│  lógica?    │            │• Module      │
│• ¿Cómo      │            │• DI          │
│  pruebo?    │            │• Tests       │
└─────────────┘            └─────────────┘
```

### Analogía del restaurante 🍽️

```
CLIENTE ──► MESERO ──► COCINA ──► NEVERA ──► COCINA ──► MESERO ──► CLIENTE
(HTTP)     (Controller) (Service)   (DB)        (Service)  (Controller) (Response)

NestJS:
Controller = El mesero que recibe pedidos
Service = La cocina que prepara la comida
Module = El manager que organiza todo
Database = La nevera donde están los ingredientes
```

---

## Instalación y Setup

### Requisitos previos

```bash
# Verificar Node.js (debe ser 18+)
node --version

# Instalar NestJS CLI
npm i -g @nestjs/cli

# Verificar instalación
nest --version
```

### Crear nuevo proyecto

```bash
# Crear proyecto
nest new task-manager

# Entrar al proyecto
cd task-manager

# Instalar dependencias necesarias
pnpm add @nestjs/typeorm typeorm pg class-validator class-transformer @nestjs/swagger swagger-ui-express dotenv

# Dependencias para tests
pnpm add -D @nestjs/testing jest ts-jest @types/jest
```

### Configurar PostgreSQL

```bash
# macOS: iniciar PostgreSQL
brew services start postgresql@16

# Crear base de datos
createdb task_manager_db

# Verificar
psql -U postgres -d task_manager_db -c "\dt"
```

### Archivo .env

```env
# .env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=task_manager_db
PORT=3000
```

### Configurar tsconfig.json

```json
{
  "compilerOptions": {
    "types": ["jest"],
    "strictPropertyInitialization": false
  }
}
```

---

## Arquitectura básica

### La triada fundamental

```
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE ─ MODULE ─ CONTROLLER             │
│                                                             │
│  CONTROLLER                                                 │
│  - Recibe las peticiones HTTP                               │
│  - Extrae datos con @Body, @Param, @Query                 │
│  - Delega al Service                                        │
│  - Retorna respuestas HTTP                                  │
│                                                             │
│  SERVICE                                                    │
│  - Contiene la lógica de negocio                            │
│  - Accede a la base de datos (via Repository)              │
│  - Retorna datos al Controller                               │
│                                                             │
│  MODULE                                                     │
│  - Agrupa funcionalidad relacionada                          │
│  - Registra controllers y services                           │
│  - Conecta con TypeORM                                      │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de una petición

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  main.ts                                                    │
│  └─► ValidationPipe (valida el body)                        │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  Controller                                                  │
│  └─► @Body() extrae datos                                   │
│  └─► @Param('id') extrae parámetros de URL                 │
│  └─► @Query('status') extrae query strings                 │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  Service                                                     │
│  └─► Lógica de negocio                                       │
│  └─► repository.find(), save(), etc.                        │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  TypeORM (Repository)                                        │
│  └─► Genera SQL automáticamente                             │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL                                                 │
│  └─► Ejecuta el SQL                                         │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
HTTP Response
```

### Estructura de archivos

```
src/
├── main.ts                    # Entry point
├── app.module.ts              # Módulo raíz
└── tasks/
    ├── tasks.module.ts        # Módulo de tareas
    ├── tasks.controller.ts    # Endpoints HTTP
    ├── tasks.service.ts       # Lógica de negocio
    ├── tasks.service.spec.ts  # Tests del service
    ├── tasks.controller.spec.ts # Tests del controller
    ├── tasks.seeder.ts        # Datos iniciales
    ├── dto/
    │   └── task.dto.ts        # Validación de datos
    └── entities/
        └── task.entity.ts    # Tabla en la DB
```

---

## Crear el proyecto paso a paso

### Paso 1: Limpiar archivos

```bash
rm src/app.controller.ts
rm src/app.controller.spec.ts
rm src/app.service.ts

mkdir -p src/tasks/dto
mkdir -p src/tasks/entities
```

### Paso 2: Crear el Módulo

```typescript
// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksSeeder } from './tasks.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [TasksController],
  providers: [TasksService, TasksSeeder],
})
export class TasksModule {}
```

### Paso 3: Registrar en AppModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';
import { Task } from './tasks/entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_DATABASE ?? 'task_manager_db',
      entities: [Task],
      synchronize: true,  // Solo en desarrollo
    }),
    TasksModule,
  ],
})
export class AppModule {}
```

### Paso 4: Crear la Entidad

```typescript
// src/tasks/entities/task.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Enum para estados
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status!: TaskStatus;

  @Column({ type: 'int', default: 0 })
  priority!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

**¿Por qué usar `!` (non-null assertion)?**

```
SIN ! → Error en IDE (TypeScript no sabe que se inicializa después)
CON ! → TypeScript confía en que el decorator lo inicializa
```

### Paso 5: Crear los DTOs

```typescript
// src/tasks/dto/task.dto.ts
import { IsString, IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../entities/task.entity';

// DTO para crear tareas
export class CreateTaskDto {
  @ApiProperty({ example: 'Terminar proyecto' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Descripción opcional' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;
}

// DTO para actualizar tareas
export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Nuevo título' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Nueva descripción' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'in_progress', enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;
}
```

### Paso 6: Crear el Servicio

```typescript
// src/tasks/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async getTasks(status?: TaskStatus): Promise<Task[]> {
    if (status) {
      return this.taskRepository.find({
        where: { status },
        order: { priority: 'DESC', createdAt: 'DESC' },
      });
    }
    return this.taskRepository.find({
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  async getTaskById(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }
    return task;
  }

  async createTask(dto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create(dto);
    return this.taskRepository.save(task);
  }

  async updateTask(id: number, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.getTaskById(id);
    return this.taskRepository.save({ ...task, ...dto });
  }

  async deleteTask(id: number): Promise<void> {
    const task = await this.getTaskById(id);
    await this.taskRepository.remove(task);
  }

  async getTaskStats() {
    const total = await this.taskRepository.count();
    const pending = await this.taskRepository.count({ where: { status: TaskStatus.PENDING } });
    const inProgress = await this.taskRepository.count({ where: { status: TaskStatus.IN_PROGRESS } });
    const completed = await this.taskRepository.count({ where: { status: TaskStatus.COMPLETED } });
    return { total, pending, inProgress, completed };
  }
}
```

### Paso 7: Crear el Controlador

```typescript
// src/tasks/tasks.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
  UsePipes, ValidationPipe, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskStatus } from './entities/task.entity';

@ApiTags('tasks')
@Controller('tasks')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las tareas' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  getAllTasks(@Query('status') status?: TaskStatus) {
    return this.tasksService.getTasks(status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas' })
  getTaskStats() {
    return this.tasksService.getTaskStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una tarea por ID' })
  @ApiParam({ name: 'id', description: 'ID de la tarea', type: Number })
  getTaskById(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.getTaskById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva tarea' })
  createTask(@Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una tarea' })
  updateTask(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.tasksService.updateTask(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una tarea' })
  deleteTask(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.deleteTask(id);
  }
}
```

### Paso 8: Crear el Seeder (datos iniciales)

```typescript
// src/tasks/tasks.seeder.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';

@Injectable()
export class TasksSeeder implements OnModuleInit {
  constructor(@InjectRepository(Task) private taskRepository: Repository<Task>) {}

  async onModuleInit() {
    const count = await this.taskRepository.count();
    if (count === 0) {
      const tasks = [
        { title: 'Configurar proyecto NestJS', description: 'Inicializar proyecto', status: TaskStatus.COMPLETED, priority: 5 },
        { title: 'Diseñar base de datos', description: 'Crear modelo', status: TaskStatus.COMPLETED, priority: 5 },
        { title: 'Implementar CRUD', description: 'Endpoints completos', status: TaskStatus.COMPLETED, priority: 4 },
        { title: 'Agregar validaciones', description: 'DTOs con class-validator', status: TaskStatus.COMPLETED, priority: 4 },
        { title: 'Configurar Swagger', description: 'Documentación automática', status: TaskStatus.COMPLETED, priority: 3 },
        { title: 'Crear tests unitarios', description: 'Jest con mocks', status: TaskStatus.IN_PROGRESS, priority: 4 },
        { title: 'Implementar autenticación JWT', description: 'Passport + JWT', status: TaskStatus.PENDING, priority: 5 },
        { title: 'Configurar CORS', description: 'Habilitar frontend', status: TaskStatus.COMPLETED, priority: 2 },
        { title: 'Deploy en Railway', description: 'Desplegar API', status: TaskStatus.PENDING, priority: 3 },
        { title: 'Agregar paginación', description: 'Limit + offset', status: TaskStatus.PENDING, priority: 3 },
        { title: 'Variables de entorno', description: '@nestjs/config', status: TaskStatus.COMPLETED, priority: 3 },
        { title: 'Agregar logging', description: 'Winston', status: TaskStatus.PENDING, priority: 2 },
      ];
      await this.taskRepository.save(tasks);
      console.log('✅ Seed completado: 12 tareas creadas');
    }
  }
}
```

### Paso 9: Configurar main.ts

```typescript
// src/main.ts
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Task Manager API')
    .setDescription('API para gestionar tareas')
    .setVersion('1.0')
    .addTag('tasks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger: http://localhost:${process.env.PORT ?? 3000}/api`);
}
void bootstrap();
```

---

## Tests Unitarios Explicados

### ¿Por qué hacer tests?

```
SIN TESTS                           CON TESTS
─────────────────────────          ─────────────────────────
Escribes código                    Escribes código
Lo subes a producción              Ejecutas tests
"Ups, falló algo"                  "Falló test" → Arreglas
                                   Antes de producción ✓
```

### El patrón AAA

```
┌─────────────────────────────────────────────────────────────┐
│                 ARRANGE → ACT → ASSERT                    │
│                                                             │
│  ARRANGE: Preparar datos                                    │
│    mockRepository.find.mockResolvedValue([task])          │
│                                                             │
│  ACT: Ejecutar función                                     │
│    const result = await service.getTasks()                │
│                                                             │
│  ASSERT: Verificar resultado                               │
│    expect(result).toEqual([task])                          │
└─────────────────────────────────────────────────────────────┘
```

### Test del Servicio

```typescript
// src/tasks/tasks.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './entities/task.entity';

describe('TasksService', () => {
  let service: TasksService;

  // ============================================================
  // MOCKS - Simulamos la base de datos
  // ============================================================
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

  // ============================================================
  // beforeEach - Se ejecuta antes de cada test
  // ============================================================
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,  // El servicio REAL que probamos
        {
          provide: getRepositoryToken(Task),  // Inyectar mock
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    jest.clearAllMocks();
  });

  // ============================================================
  // TESTS
  // ============================================================
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTasks', () => {
    it('should return all tasks', async () => {
      // ARRANGE
      mockRepository.find.mockResolvedValue([mockTask]);

      // ACT
      const result = await service.getTasks();

      // ASSERT
      expect(result).toEqual([mockTask]);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      mockRepository.find.mockResolvedValue([mockTask]);
      const result = await service.getTasks(TaskStatus.PENDING);

      expect(result).toEqual([mockTask]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: TaskStatus.PENDING },
        order: { priority: 'DESC', createdAt: 'DESC' },
      });
    });
  });

  describe('getTaskById', () => {
    it('should return a task', async () => {
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
    it('should create a task', async () => {
      const dto = { title: 'New Task', description: 'New', priority: 2 };
      mockRepository.create.mockReturnValue({ ...dto, id: 2 });
      mockRepository.save.mockResolvedValue({ ...dto, id: 2 });

      const result = await service.createTask(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('id');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.remove.mockResolvedValue(mockTask);

      await service.deleteTask(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTask);
    });
  });
});
```

### Test del Controlador

```typescript
// src/tasks/tasks.controller.spec.ts
/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/task.dto';
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

  // ============================================================
  // MOCK del SERVICE
  // ============================================================
  const mockTasksService = {
    getTasks: jest.fn().mockResolvedValue([mockTask]),
    getTaskById: jest.fn().mockResolvedValue(mockTask),
    createTask: jest.fn().mockResolvedValue(mockTask),
    updateTask: jest.fn().mockResolvedValue(mockTask),
    deleteTask: jest.fn().mockResolvedValue(undefined),
    getTaskStats: jest.fn().mockResolvedValue({ total: 1, pending: 1, inProgress: 0, completed: 0 }),
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
      expect(mockTasksService.getTasks).toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    it('should return a task', async () => {
      const result = await controller.getTaskById(1);
      expect(result).toBeDefined();
      expect(mockTasksService.getTaskById).toHaveBeenCalledWith(1);
    });
  });

  describe('createTask', () => {
    it('should create a task', async () => {
      const dto: CreateTaskDto = { title: 'New Task', description: 'New', priority: 2 };
      const result = await controller.createTask(dto);
      expect(result).toBeDefined();
      expect(mockTasksService.createTask).toHaveBeenCalledWith(dto);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      await controller.deleteTask(1);
      expect(mockTasksService.deleteTask).toHaveBeenCalledWith(1);
    });
  });
});
```

---

## Conceptos Clave de NestJS

### Decoradores HTTP

| Decorador | Método HTTP | Ejemplo URL |
|-----------|------------|-------------|
| `@Get()` | GET | `GET /tasks` |
| `@Post()` | POST | `POST /tasks` |
| `@Put()` | PUT | `PUT /tasks/1` |
| `@Patch()` | PATCH | `PATCH /tasks/1` |
| `@Delete()` | DELETE | `DELETE /tasks/1` |

### Decoradores de datos

| Decorador | Qué obtiene | Ejemplo |
|-----------|-------------|---------|
| `@Body()` | Cuerpo JSON | `POST /tasks` con body |
| `@Param('id')` | Parámetro URL | `/tasks/5` → `id=5` |
| `@Query('page')` | Query string | `?page=1` → `page=1` |
| `@Headers('auth')` | Header | `Authorization: Bearer xxx` |

### Pipes

| Pipe | Función |
|------|---------|
| `ValidationPipe` | Valida datos contra DTO |
| `ParseIntPipe` | Convierte string a número |

### Inyección de dependencias

```typescript
// ¿Qué hace?
@Controller('tasks')
export class TasksController {
  constructor(private service: TasksService) {}  // NestJS lo inyecta automáticamente
}

// Sin DI manual:
// const service = new TasksService(new TaskRepository())

// Con DI:
// NestJS crea todo y te lo entrega
```

### HTTP Status Codes

| Código | Nombre | Cuándo |
|--------|--------|--------|
| 200 | OK | GET exitoso |
| 201 | Created | POST creó algo |
| 204 | No Content | DELETE sin body |
| 400 | Bad Request | Datos inválidos |
| 404 | Not Found | No existe |

---

## Referencia Rápida

### Comandos

```bash
# Iniciar desarrollo
pnpm run start:dev

# Compilar
pnpm run build

# Tests
pnpm test

# Tests con watch
pnpm run test:watch
```

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/tasks` | Listar todas |
| GET | `/tasks?status=pending` | Filtrar por estado |
| GET | `/tasks/stats` | Estadísticas |
| GET | `/tasks/:id` | Una por ID |
| POST | `/tasks` | Crear |
| PATCH | `/tasks/:id` | Actualizar |
| DELETE | `/tasks/:id` | Eliminar |

### Swagger

Accede a: `http://localhost:3000/api`

---

## Próximos Pasos

1. **Autenticación JWT** → `@nestjs/passport`
2. **Relaciones** → OneToMany, ManyToMany
3. **Paginación** → `take`, `skip`
4. **Deploy** → Docker, Railway

---

## Recursos

- [Documentación oficial de NestJS](https://docs.nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [Jest](https://jestjs.io/)

---

**¡Éxito en tu aprendizaje! 🚀**