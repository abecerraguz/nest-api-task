# Guía Paso a Paso: Crear un Task Manager con NestJS 📚

> Esta guía te llevará paso a paso para crear un administrador de tareas desde cero.
> Al final, tendrás una API REST completa con PostgreSQL.

---

## Tabla de Contenidos

1. [Preparar el entorno](#1-preparar-el-entorno)
2. [Crear el proyecto](#2-crear-el-proyecto)
3. [Estructura inicial](#3-estructura-inicial)
4. [Configurar base de datos](#4-configurar-base-de-datos)
5. [Crear el Módulo](#5-crear-el-módulo)
6. [Crear la Entidad](#6-crear-la-entidad)
7. [Crear el Servicio](#7-crear-el-servicio)
8. [Crear el Controlador](#8-crear-el-controlador)
9. [Crear los DTOs](#9-crear-los-dtos)
10. [Configurar main.ts](#10-configurar-maints)
11. [Probar la API](#11-probar-la-api)
12. [Añadir tests](#12-añadir-tests)

---

## 1. Preparar el entorno

### Verificar herramientas

```bash
# Verificar Node.js (debe ser 18+)
node --version

# Verificar npm
npm --version

# Instalar NestJS CLI globalmente
npm i -g @nestjs/cli

# Verificar que se instaló
nest --version
```

### Iniciar PostgreSQL (macOS)

```bash
# Si usas Homebrew
brew services start postgresql@16

# Crear la base de datos
createdb task_manager_db

# Verificar conexión
psql -U postgres -d task_manager_db -c "\dt"
```

---

## 2. Crear el proyecto

### Generar proyecto nuevo

```bash
# Crear proyecto (responde las preguntas)
nest new task-manager

# Entrar al proyecto
cd task-manager

# Responder:
# - Package manager: pnpm (o npm/yarn)
# - others: defaults

# Instalar dependencias necesarias
pnpm add @nestjs/typeorm typeorm pg class-validator class-transformer @nestjs/swagger swagger-ui-express

pnpm add dotenv
```

### Estructura inicial

```
task-manager/
├── src/
│   ├── app.controller.ts
│   ├── app.controller.spec.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── test/
├── node_modules/
└── package.json
```

---

## 3. Estructura inicial

### Limpiar archivos por defecto

```bash
# Eliminar archivos que no necesitamos
rm src/app.controller.ts
rm src/app.controller.spec.ts
rm src/app.service.ts
```

### Crear estructura de carpetas

```bash
# Crear carpetas del módulo tasks
mkdir -p src/tasks/dto
mkdir -p src/tasks/entities
```

### Verificar que todo funciona

```bash
pnpm run start:dev
```

Visita `http://localhost:3000` - Deberías ver un mensaje de error (porque borramos el controller).

---

## 4. Configurar base de datos

### Crear archivo de variables de entorno

```bash
# Crear archivo .env en la raíz
touch .env
```

### Contenido de .env

```env
# .env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=task_manager_db
PORT=3000
```

### Crear archivo .env.example (para compartir)

```env
# .env.example (copia sin valores sensibles)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DATABASE=nombre_db
PORT=3000
```

### Instalar dotenv

```bash
pnpm add dotenv
```

---

## 5. Crear el Módulo

### Paso 5.1: Crear el archivo

Crea `src/tasks/tasks.module.ts`:
o Crea con `nest generate module tasks --no-spec` :
```typescript
// tasks.module.ts
import { Module } from '@nestjs/common';

@Module({
  imports: [],      // Módulos que este módulo necesita
  controllers: [],  // Controllers de este módulo
  providers: [],    // Services de este módulo
})
export class TasksModule {}
```

### Paso 5.2: Registrar en AppModule

Abre `src/app.module.ts` y modifícalo:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    // Configuración de la base de datos
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_DATABASE ?? 'task_manager_db',
      entities: [],          // Agregaremos entidades aquí le indica a TypeORM qué tablas debe concocer
      synchronize: true,     // Solo en desarrollo
    }),
    // Importar nuestro módulo de tareas
    TasksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### Paso 5.3: Cargar variables de entorno

Añade esto al inicio de `src/main.ts`:

```typescript
// src/main.ts
import 'dotenv/config';  // Cargar variables de entorno

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

### Verificar

```bash
pnpm run start:dev
```

Deberías ver que se conecta a PostgreSQL.

---

## 6. Crear la Entidad

### ¿Qué es una Entidad?

> La Entidad define cómo será la tabla en la base de datos.

### Configuración de TypeScript

Antes de crear la entidad, necesitas decirle a TypeScript que las propiedades inicializadas por decorators (como TypeORM) son válidas. Esto se hace con el operador `!` (non-null assertion).

### Crear `src/tasks/entities/task.entity.ts`

```typescript
// task.entity.ts
import {
  Entity,           // Marca esta clase como tabla
  Column,           // Define una columna
  PrimaryGeneratedColumn,  // ID auto-generado
  CreateDateColumn, // Fecha de creación automática
  UpdateDateColumn, // Fecha de actualización automática
} from 'typeorm';

// Enum para los estados de la tarea
export enum TaskStatus {
  PENDING = 'pending',           // Pendiente
  IN_PROGRESS = 'in_progress', // En progreso
  COMPLETED = 'completed',      // Completada
}

@Entity()  // "Esta clase es una tabla"
export class Task {
  // PRIMARY KEY AUTO INCREMENT
  // El operador ! (non-null assertion) indica que TypeScript
  // confíe en que esta propiedad se inicializa después
  @PrimaryGeneratedColumn()
  id!: number;

  // Columna "title" de tipo texto
  @Column()
  title!: string;

  // Columna opcional de texto largo
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  // Columna enum con valor por defecto "pending"
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status!: TaskStatus;

  // Columna numérica con valor por defecto 0
  @Column({ type: 'int', default: 0 })
  priority!: number;

  // Se llena automáticamente al crear
  @CreateDateColumn()
  createdAt!: Date;

  // Se actualiza automáticamente al modificar
  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### ¿Por qué usar `!`?

```
SIN ! (marca error en IDE):
─────────────────────────
@Entity()
export class Task {
    @PrimaryGeneratedColumn()
    id: number;  // ❌ Error: "not initialized"
}

CON ! (TypeScript confía):
─────────────────────────
@Entity()
export class Task {
    @PrimaryGeneratedColumn()
    id!: number;  // ✅ Sin error
}
                   │
                   └── El decorator @PrimaryGeneratedColumn
                       inicializa el valor cuando TypeORM
                       se conecta a la base de datos
```

TypeScript no "ve" lo que hacen los decorators en tiempo de ejecución. El `!` le dice: "confía en mí, esto se inicializa después".

### Registrar la Entidad en el Módulo

```typescript
// tasks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';

@Module({
  imports: [
    // Le dice a TypeORM: "Este módulo maneja la entidad Task"
    TypeOrmModule.forFeature([Task]),
  ],
  controllers: [],
  providers: [],
})
export class TasksModule {}
```

### Registrar en AppModule

```typescript
// app.module.ts
import { Task } from './tasks/entities/task.entity';

TypeOrmModule.forRoot({
  entities: [Task],  // ← Agregar aquí
}),
```

---

## 7. Crear el Servicio

### ¿Qué es un Servicio?

> El Servicio contiene la **lógica de negocio**. Aquí va todo el código que procesa datos.

### Crear `src/tasks/tasks.service.ts`
### Ejecutar `nest g service tasks --no-spec`

```typescript
// tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
// Injectable: Permite que NestJS inyecte este servicio
// NotFoundException: Lanza error 404 cuando no encuentra algo

import { InjectRepository } from '@nestjs/typeorm';
// Permite inyectar el repositorio de TypeORM

import { Repository } from 'typeorm';
// Repository: El objeto que nos permite hacer CRUD en la DB

import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

// Marcar como inyectable
@Injectable()
export class TasksService {
  // El constructor recibe el repositorio de Task
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  // Obtener todas las tareas (con filtro opcional)
  async getTasks(status?: TaskStatus): Promise<Task[]> {
    if (status) {
      // Si hay filtro, buscar por estado
      return this.taskRepository.find({
        where: { status },
        order: { priority: 'DESC', createdAt: 'DESC' },
      });
    }

    // Sin filtro, retornar todas ordenadas
    return this.taskRepository.find({
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  // Obtener una tarea por ID
  async getTaskById(id: number): Promise<Task> {
    // Buscar en la base de datos
    const task = await this.taskRepository.findOne({
      where: { id },
    });

    // Si no existe, lanzar error 404
    if (!task) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }

    return task;
  }

  // Crear una nueva tarea
  async createTask(dto: CreateTaskDto): Promise<Task> {
    // Crear instancia sin guardar aún
    const task = this.taskRepository.create(dto);
    // Guardar en la base de datos
    return this.taskRepository.save(task);
  }

  // Actualizar una tarea existente
  async updateTask(id: number, dto: UpdateTaskDto): Promise<Task> {
    // Primero verificar que existe
    const task = await this.getTaskById(id);
    // Mezclar datos actuales con nuevos (spread operator)
    const updated = { ...task, ...dto };
    // Guardar (TypeORM detecta que tiene ID, hace UPDATE)
    return this.taskRepository.save(updated);
  }

  // Eliminar una tarea
  async deleteTask(id: number): Promise<void> {
    // Verificar que existe
    const task = await this.getTaskById(id);
    // Eliminar de la base de datos
    await this.taskRepository.remove(task);
  }

  // Obtener estadísticas
  async getTaskStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }> {
    const total = await this.taskRepository.count();
    const pending = await this.taskRepository.count({
      where: { status: TaskStatus.PENDING },
    });
    const inProgress = await this.task_repository.count({
      where: { status: TaskStatus.IN_PROGRESS },
    });
    const completed = await this.taskRepository.count({
      where: { status: TaskStatus.COMPLETED },
    });

    return { total, pending, inProgress, completed };
  }
}
```

### Registrar el Servicio en el Módulo

```typescript
// tasks.module.ts
import { TasksService } from './tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [],
  providers: [TasksService],  // ← Agregar aquí
})
export class TasksModule {}
```

---

## 8. Crear el Controlador

### ¿Qué es un Controlador?

> El Controlador recibe las peticiones HTTP y delega al Servicio.

### Crear `src/tasks/tasks.controller.ts`

```typescript
// tasks.controller.ts
import {
  Controller,       // Marca la clase como controlador
  Get,              // Responde a GET
  Post,             // Responde a POST
  Patch,            // Responde a PATCH
  Delete,           // Responde a DELETE
  Body,             // Extrae el body de la petición
  Param,            // Extrae parámetros de la URL
  Query,            // Extrae query strings
  HttpCode,         // Cambia el código HTTP
  HttpStatus,       // Enum de códigos HTTP
  ParseIntPipe,     // Convierte string a número
} from '@nestjs/common';

import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskStatus } from './entities/task.entity';

// Ruta base del controlador
@Controller('tasks')
export class TasksController {
  // Inyectar el servicio
  constructor(private readonly tasksService: TasksService) {}

  // GET /tasks
  @Get()
  getAllTasks(@Query('status') status?: TaskStatus) {
    return this.tasksService.getTasks(status);
  }

  // GET /tasks/stats
  @Get('stats')
  getTaskStats() {
    return this.tasksService.getTaskStats();
  }

  // GET /tasks/:id
  @Get(':id')
  getTaskById(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.getTaskById(id);
  }

  // POST /tasks
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTask(@Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(dto);
  }

  // PATCH /tasks/:id
  @Patch(':id')
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(id, dto);
  }

  // DELETE /tasks/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTask(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.deleteTask(id);
  }
}
```

### Registrar el Controlador en el Módulo

```typescript
// tasks.module.ts
import { TasksController } from './tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [TasksController],  // ← Agregar aquí
  providers: [TasksService],
})
export class TasksModule {}
```

---

## 9. Crear los DTOs

### ¿Qué es un DTO?

> DTO (Data Transfer Object) define qué datos acepta tu API y cómo validarlos.

### Crear `src/tasks/dto/task.dto.ts`

```typescript
// task.dto.ts
import { IsString, IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../entities/task.entity';

// DTO para crear tareas (POST)
export class CreateTaskDto {
  @ApiProperty({ example: 'Terminar proyecto' })
  @IsString()
  @IsString()  // Debe ser texto
  title: string;

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

// DTO para actualizar tareas (PATCH)
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

---

## 10. Configurar main.ts

### Configuración completa

```typescript
// src/main.ts
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  // 1. Crear la aplicación
  const app = await NestFactory.create(AppModule);

  // 2. Habilitar CORS (para frontend)
  app.enableCors();

  // 3. ValidationPipe global (valida todas las peticiones)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Elimina campos no definidos
      forbidNonWhitelisted: true, // Error si hay campos extra
      transform: true,             // Convierte tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 4. Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Task Manager API')
    .setDescription('API para gestionar tareas')
    .setVersion('1.0')
    .addTag('tasks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 5. Iniciar servidor
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger: http://localhost:${process.env.PORT ?? 3000}/api`);
}

bootstrap();
```

---

## 11. Probar la API

### Iniciar el servidor

```bash
pnpm run start:dev
```

### Endpoints disponibles

```bash
# Ver Swagger
open http://localhost:3000/api

# Crear tarea
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi primera tarea","priority":3}'

# Ver todas las tareas
curl http://localhost:3000/tasks

# Ver estadísticas
curl http://localhost:3000/tasks/stats

# Ver una tarea (reemplaza 1 por el ID)
curl http://localhost:3000/tasks/1

# Actualizar tarea
curl -X PATCH http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'

# Eliminar tarea
curl -X DELETE http://localhost:3000/tasks/1
```

### Probar validación (debería dar error 400)

```bash
# Sin título (requerido)
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"priority":3}'

# Título vacío
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":""}'
```

---

## 12. Añadir Tests

### ¿Qué son los tests y por qué importan?

```
┌─────────────────────────────────────────────────────────────┐
│                     SIN TESTS                             │
│                                                             │
│  Escribes código                                           │
│       ↓                                                     │
│  Lo subes a producción                                      │
│       ↓                                                     │
│  "Ups, falló algo"                                         │
│       ↓                                                     │
│  100 usuarios afectados 😱                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      CON TESTS                              │
│                                                             │
│  Escribes código                                           │
│       ↓                                                     │
│  Ejecutas tests (automatizado)                             │
│       ↓                                                     │
│  "Falló un test" → Lo arreglas antes de producción ✓       │
│                                                             │
│  100 usuarios felices 😊                                   │
└─────────────────────────────────────────────────────────────┘
```

### Tipos de tests

| Tipo | ¿Qué prueba? | Ejemplo |
|------|-------------|---------|
| **Unitario** | Una función específica | "¿getTasks retorna array?" |
| **Integración** | Múltiples partes juntas | "¿Controller + Service funcionan?" |
| **E2E** | Toda la app desde el usuario | "¿POST /tasks crea una tarea?" |

Nosotros haremos **tests unitarios** usando **Jest**.

---

### Dependencias necesarias

Si aún no están instaladas:

```bash
pnpm add -D @nestjs/testing jest ts-jest @types/jest
```

### Configurar TypeScript para Jest

Abre `tsconfig.json` y agrega:

```json
{
  "compilerOptions": {
    "types": ["jest"]  // ← Esto permite usar describe, it, expect
  }
}
```

---

### El patrón AAA

Todo test sigue 3 pasos:

```
┌─────────────────────────────────────────────────────────────┐
│                 ARRANGE → ACT → ASSERT                     │
│                                                             │
│  ARRANGE: Preparar los datos                                │
│    mockRepository.find.mockResolvedValue([task])          │
│                                                             │
│  ACT: Ejecutar la función                                   │
│    const result = await service.getTasks()                │
│                                                             │
│  ASSERT: Verificar el resultado                             │
│    expect(result).toEqual([task])                         │
└─────────────────────────────────────────────────────────────┘
```

---

### Crear test del Servicio

```bash
mkdir -p src/tasks
```

```typescript
// src/tasks/tasks.service.spec.ts

// ============================================================
// IMPORTS - Herramientas de testing
// ============================================================
import { Test, TestingModule } from '@nestjs/testing';
// Test: Clase para crear módulos de prueba
// TestingModule: El mini-NestJS que usaremos en los tests

import { getRepositoryToken } from '@nestjs/typeorm';
// getRepositoryToken: Necesario para inyectar el mock del repositorio

import { NotFoundException } from '@nestjs/common';
// NotFoundException: Para verificar que los errores 404 funcionan

import { TasksService } from './tasks.service';
// TasksService: El servicio que vamos a probar

import { Task, TaskStatus } from './entities/task.entity';
// Task: Para tipar nuestro mock de tarea

// ============================================================
// describe() - Agrupa tests relacionados
// ============================================================
describe('TasksService', () => {
  // ============================================================
  // Variables del test
  // ============================================================
  let service: TasksService;

  // Mock de una tarea (simula lo que viene de la DB)
  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test description',
    status: TaskStatus.PENDING,
    priority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock del repositorio (simula la base de datos)
  // En vez de conectar a PostgreSQL real, usamos funciones falsas
  const mockRepository = {
    find: jest.fn(),      // Simula: SELECT * FROM tasks
    findOne: jest.fn(),   // Simula: SELECT * FROM tasks WHERE id = ?
    create: jest.fn(),    // Simula: INSERT INTO tasks
    save: jest.fn(),      // Simula: guardar en la DB
    remove: jest.fn(),    // Simula: DELETE FROM tasks
    count: jest.fn(),     // Simula: COUNT(*)
  };

  // ============================================================
  // beforeEach() - Se ejecuta ANTES de cada test
  // ============================================================
  // ¿Por qué? Para asegurar que cada test empieza limpio
  beforeEach(async () => {
    // 1. Crear un mini-NestJS de prueba
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // 2. El servicio REAL que vamos a probar
        TasksService,

        // 3. El MOCK del repositorio (NO el real)
        // Esto reemplaza la conexión a PostgreSQL
        {
          provide: getRepositoryToken(Task),
          useValue: mockRepository,
        },
      ],
    }).compile();

    // 4. Obtener la instancia del servicio
    service = module.get<TasksService>(TasksService);

    // 5. Limpiar todos los mocks antes del siguiente test
    jest.clearAllMocks();
  });

  // ============================================================
  // it() - Un test individual
  // ============================================================
  it('should be defined', () => {
    // Verifica que el servicio se creó correctamente
    expect(service).toBeDefined();
  });

  // ============================================================
  // describe() anidado - Agrupa tests de una función específica
  // ============================================================
  describe('getTasks', () => {
    it('should return all tasks', async () => {
      // ARRANGE: Programar el mock para que retorne tareas
      mockRepository.find.mockResolvedValue([mockTask]);

      // ACT: Ejecutar la función real
      const result = await service.getTasks();

      // ASSERT: Verificar el resultado
      expect(result).toEqual([mockTask]);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should filter tasks by status', async () => {
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

    // ============================================================
    // Test de ERROR - Verifica que lanza excepción
    // ============================================================
    it('should throw NotFoundException if not found', async () => {
      // Programar el mock para que retorne null (no encontró nada)
      mockRepository.findOne.mockResolvedValue(null);

      // Verificar que lanza NotFoundException
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

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteTask(999)).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

### Crear test del Controlador

```typescript
// src/tasks/tasks.controller.spec.ts

/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskStatus } from './entities/task.entity';

// ============================================================
// ¿Cuál es la diferencia con el test del service?
// ============================================================
//
// tasks.service.spec.ts  → Prueba la LÓGICA (sin DB)
// tasks.controller.spec.ts → Prueba los ENDPOINTS (sin service real)
//
// En resumen:
// - Service test: "¿El service crea tareas correctamente?"
// - Controller test: "¿El controller llama al service con los datos correctos?"

describe('TasksController', () => {
  let controller: TasksController;

  // Mock de una tarea
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
  // Mock del SERVICE (el controller lo usará)
  // ============================================================
  // Aquí simulamos que el service funciona perfectamente
  const mockTasksService = {
    getTasks: jest.fn().mockResolvedValue([mockTask]),
    getTaskById: jest.fn().mockResolvedValue(mockTask),
    createTask: jest.fn().mockResolvedValue(mockTask),
    updateTask: jest.fn().mockResolvedValue(mockTask),
    deleteTask: jest.fn().mockResolvedValue(undefined),
    getTaskStats: jest.fn().mockResolvedValue({
      total: 1,
      pending: 1,
      inProgress: 0,
      completed: 0,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],  // ← Probando el Controller
      providers: [
        {
          provide: TasksService,        // ← Inyectar MOCK del service
          useValue: mockTasksService,    // ← No usa el service real
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

  describe('updateTask', () => {
    it('should update a task', async () => {
      const dto: UpdateTaskDto = { title: 'Updated' };
      const result = await controller.updateTask(1, dto);
      expect(result).toBeDefined();
      expect(mockTasksService.updateTask).toHaveBeenCalledWith(1, dto);
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

### Ejecutar tests

```bash
pnpm test
```

Deberías ver:

```
Test Suites: 2 passed, 2 total
Tests:       13 passed, 13 total
```

---

### Resumen visual de arquitectura de tests

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE TEST                             │
│                                                             │
│  TestingModule                                              │
│  ┌─────────────────────────────────────────────────┐       │
│  │  TasksService (REAL) ← Probamos esto             │       │
│  │  Repository (MOCK) ← Simulamos la DB             │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ¿Qué probamos?                                           │
│  - ¿El service busca correctamente?                        │
│  - ¿El service crea tareas?                               │
│  - ¿El service lanza 404 cuando no encuentra?              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   CONTROLLER TEST                           │
│                                                             │
│  TestingModule                                              │
│  ┌─────────────────────────────────────────────────┐       │
│  │  TasksController (REAL) ← Probamos esto         │       │
│  │  TasksService (MOCK) ← Simulamos el service      │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ¿Qué probamos?                                           │
│  - ¿El controller recibe bien los parámetros?              │
│  - ¿El controller llama al service?                        │
│  - ¿El controller retorna lo correcto?                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Beneficios de los tests unitarios

| Beneficio | Descripción |
|-----------|-------------|
| **Detecta errores antes** | Encuentras bugs antes de producción |
| **Refactorización segura** | Puedes cambiar código sin miedo |
| **Documentación** | Los tests explican cómo funciona el código |
| **Confianza** | Sabes que tu código hace lo que debe |

---

### Comandos útiles

```bash
pnpm test              # Ejecutar todos los tests
pnpm run test:watch     # Reiniciar tests al guardar
pnpm run test:cov       # Ver cobertura de código
```

---

## Resumen Final

### Estructura del proyecto

```
task-manager/
├── src/
│   ├── main.ts                          # Entry point
│   ├── app.module.ts                    # Módulo raíz
│   └── tasks/
│       ├── tasks.module.ts             # Módulo de tareas
│       ├── tasks.controller.ts         # Endpoints HTTP
│       ├── tasks.service.ts            # Lógica de negocio
│       ├── tasks.service.spec.ts       # Tests del servicio
│       ├── tasks.controller.spec.ts    # Tests del controlador
│       ├── dto/
│       │   └── task.dto.ts             # Validación de datos
│       └── entities/
│           └── task.entity.ts          # Tabla en la DB
├── .env                                # Variables de entorno
├── .env.example                        # Template de variables
└── package.json
```

### Conceptos aprendidos

| Concepto | Para qué sirve |
|----------|---------------|
| `@Controller` | Define un controlador |
| `@Get`, `@Post`, `@Patch`, `@Delete` | Define rutas HTTP |
| `@Body`, `@Param`, `@Query` | Extrae datos de la petición |
| `@Injectable` | Marca una clase como inyectable |
| `@InjectRepository` | Inyecta el repositorio de TypeORM |
| `Repository<T>` | Objeto para hacer CRUD |
| `@Entity`, `@Column` | Define la estructura de la tabla |
| DTO | Define y valida los datos de entrada |
| ValidationPipe | Valida automáticamente las peticiones |
| Swagger | Documentación automática de la API |

### Conceptos de Testing

| Concepto | Para qué sirve |
|----------|---------------|
| `describe()` | Agrupa tests relacionados |
| `it()` / `test()` | Define un test individual |
| `beforeEach()` | Ejecuta código antes de cada test |
| `jest.fn()` | Crea una función mock |
| `mockResolvedValue()` | Programa qué debe retornar el mock |
| `expect()` | Verifica el resultado |
| `toHaveBeenCalled()` | Verifica que una función fue llamada |
| `toEqual()` | Verifica igualdad de valores |
| `toThrow()` | Verifica que se lance una excepción |
| ARRANGE → ACT → ASSERT | Patrón para estructurar tests |

---

**¡Felicidades! Ahora tienes tu Task Manager completo** 🎉

Para continuar aprendiendo:
1. Agregar autenticación (JWT)
2. Añadir paginación
3. Implementar relaciones entre entidades
4. Deploy en producción
