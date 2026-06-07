# Guía Paso a Paso: Migración a Arquitectura Hexagonal en NestJS

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Conceptos Fundamentales](#conceptos-fundamentales)
3. [Estructura del Proyecto Original](#estructura-del-proyecto-original)
4. [Paso 1: Crear la Estructura de Carpetas](#paso-1-crear-la-estructura-de-carpetas)
5. [Paso 2: Crear la Capa de Dominio](#paso-2-crear-la-capa-de-dominio)
6. [Paso 3: Crear la Capa de Aplicación (Use Cases)](#paso-3-crear-la-capa-de-aplicación-use-cases)
7. [Paso 4: Crear la Capa de Infraestructura](#paso-4-crear-la-capa-de-infraestructura)
8. [Paso 5: Configurar el Módulo](#paso-5-configurar-el-módulo)
9. [Paso 6: Actualizar app.module.ts](#paso-6-actualizar-appmodulets)
10. [Paso 7: Eliminar Archivos Antiguos](#paso-7-eliminar-archivos-antiguos)
11. [Paso 8: Configurar Jest para Tests](#paso-8-configurar-jest-para-tests)
12. [Paso 9: Verificar que Todo Funcione](#paso-9-verificar-que-todo-funcione)
13. [Conclusión](#conclusión)

---

## Introducción

### ¿Qué es la Arquitectura Hexagonal?

La **Arquitectura Hexagonal** (también conocida como **Ports & Adapters** o **Arquitectura de Cebolla**) es un patrón arquitectónico que separa la lógica de negocio del resto de la aplicación.

### ¿Por qué migrar a Arquitectura Hexagonal?

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROBLEMA ACTUAL                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Controller ──► Service ──► Entity ──► Repository ──► Database │
│                                                                  │
│   ❌ Acoplamiento fuerte entre capas                            │
│   ❌ La lógica de negocio depende de frameworks (TypeORM)        │
│   ❌ Dificultad para hacer unit tests                            │
│   ❌ Cambios en una capa afectan a las demás                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOLUCIÓN HEXAGONAL                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    INFRASTRUCTURE                       │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│   │   │  Controller  │  │  Repository  │  │   Seeder     │  │   │
│   │   │   (HTTP)     │  │   (DB)       │  │              │  │   │
│   │   └──────┬───────┘  └──────┬───────┘  └──────────────┘  │   │
│   └──────────┼────────────────┼──────────────────────────────┘  │
│              │                │                                 │
│              ▼                ▼                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    APPLICATION                          │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│   │   │ CreateTask   │  │ GetTaskById  │  │ DeleteTask   │  │   │
│   │   │ UseCase      │  │ UseCase      │  │ UseCase      │  │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      DOMAIN                               │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│   │   │  Task Entity │  │TaskStatus   │  │ Repository   │  │   │
│   │   │  (Pure)      │  │   Enum      │  │   Port       │  │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ✅ Independencia total de frameworks                          │
│   ✅ Unit tests sin dependencias externas                        │
│   ✅ Fácil reemplazo de bases de datos                          │
│   ✅ Lógica de negocio testeable y mantenible                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Conceptos Fundamentales

### Las Tres Capas Principales

| Capa | Responsabilidad | Ejemplo |
|------|-----------------|---------|
| **Domain** | Reglas de negocio puras, sin dependencias externas | `Task`, `TaskStatus`, `RepositoryPort` |
| **Application** | Orquestación de casos de uso, coordina el flujo | `CreateTaskUseCase`, `GetTasksUseCase` |
| **Infrastructure** | Adaptadores externos (DB, HTTP, etc.) | `TaskRepository`, `TasksController` |

### Principios Clave

1. **El Dominio NO conoce a nadie** - No puede importar de Application ni Infrastructure
2. **Application conoce al Dominio** - Usa entidades y ports, pero no sabe cómo se persisten
3. **Infrastructure implementa los ports** - Conecta el mundo exterior con nuestra aplicación

---

## Estructura del Proyecto Original

```
src/
├── main.ts
├── app.module.ts
└── tasks/
    ├── tasks.controller.ts      # Endpoints HTTP
    ├── tasks.service.ts         # Lógica de negocio + acceso a DB
    ├── tasks.module.ts          # Módulo NestJS
    ├── tasks.seeder.ts          # Datos iniciales
    ├── tasks.service.spec.ts    # Tests del servicio
    ├── tasks.controller.spec.ts # Tests del controlador
    ├── dto/
    │   └── task.dto.ts          # DTOs para validación
    └── entities/
        └── task.entity.ts       # Entidad TypeORM (con decorators)
```

### Problemas del Código Original

```typescript
// ❌ tasks.service.ts - Mezcla de responsabilidades

// El servicio:
1. Accede directamente a TypeORM (@InjectRepository)
// 2. Conoce la estructura de la base de datos
// 3. Tiene lógica de negocio mezclada con queries
// 4. Depende de un framework específico

// ❌ task.entity.ts - Acoplamiento con TypeORM

@Entity()  // Decorador TypeORM
export class Task {
    @PrimaryGeneratedColumn()  // Conocimiento de DB
    id!: number;
    // ...
}
```

---

## Paso 1: Crear la Estructura de Carpetas

### Explicación

Primero, necesitamos crear la estructura de carpetas que separará nuestras capas. Esta estructura es la base de la arquitectura hexagonal.

```
src/tasks/
├── domain/                    ← Reglas de negocio puras
│   ├── ports/                ← Interfaces (contratos)
│   ├── task.entity.ts        ← Entidad de dominio
│   ├── task-status.enum.ts  ← Enumeraciones
│   └── index.ts              ← Barrel file
├── application/              ← Casos de uso
│   └── use-cases/            ← Cada operación es un use case
│       ├── create-task.use-case.ts
│       ├── get-tasks.use-case.ts
│       └── ...
└── infrastructure/           ← Adaptadores externos
    ├── database/             ← Repositorios (TypeORM)
    ├── http/                 ← Controladores HTTP
    │   └── dto/              ← DTOs de entrada/salida
    ├── tasks.module.ts       ← Módulo NestJS
    └── tasks.seeder.ts       ← Seeder
```

### Comando para crear la estructura

```bash
cd tu-proyecto

# Crear carpetas
mkdir -p src/tasks/domain/ports
mkdir -p src/tasks/application/use-cases
mkdir -p src/tasks/infrastructure/database
mkdir -p src/tasks/infrastructure/http/dto
```

### Estructura final

```
src/tasks/
├── domain/
│   ├── ports/
│   ├── task-status.enum.ts
│   ├── task.entity.ts
│   └── index.ts
├── application/
│   └── use-cases/
│       ├── create-task.use-case.ts
│       ├── create-task.use-case.spec.ts
│       ├── get-task-by-id.use-case.ts
│       ├── get-task-by-id.use-case.spec.ts
│       ├── delete-task.use-case.ts
│       ├── delete-task.use-case.spec.ts
│       ├── get-tasks.use-case.ts
│       ├── update-task.use-case.ts
│       ├── get-task-stats.use-case.ts
│       └── index.ts
└── infrastructure/
    ├── database/
    │   ├── task.orm-entity.ts
    │   └── task.repository.ts
    ├── http/
    │   └── dto/
    │       └── task.dto.ts
    ├── tasks.module.ts
    └── tasks.seeder.ts
```

---

## Paso 2: Crear la Capa de Dominio

### Explicación

La capa de **Dominio** es el núcleo de nuestra aplicación. Aquí живут las reglas de negocio puras, sin dependencias de frameworks externos.

### 2.1 Crear el Enum de Estado (task-status.enum.ts)

```typescript
// src/tasks/domain/task-status.enum.ts

/**
 * Enum que define los estados posibles de una tarea.
 * Este archivo representa纯粹的 бизнес-логику sin conocimiento del framework.
 */
export enum TaskStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
}
```

**¿Por qué separar el enum?**
- El enum define estados de negocio, no de base de datos
- Puede ser reutilizado en cualquier capa
- No tiene dependencias de TypeORM

### 2.2 Crear la Entidad de Dominio (task.entity.ts)

```typescript
// src/tasks/domain/task.entity.ts

import { BadRequestException } from '@nestjs/common';
import { TaskStatus } from './task-status.enum';

/**
 * Entidad de dominio - representa el concepto de "Tarea" del negocio.
 *
 * CARACTERÍSTICAS IMPORTANTES:
 * 1. No tiene decorators de TypeORM (@Entity, @Column, etc.)
 * 2. Solo tiene propiedades y métodos de negocio
 * 3. No sabe nada sobre cómo se persiste
 * 4. Incluye validaciones de reglas de negocio
 */
export class Task {
    // El ID puede ser 0 para tareas nuevas (sin guardar aún)
    id: number;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: number;
    createdAt: Date;
    updatedAt: Date;

    /**
     * Constructor privado para forzar uso de fábrica estática
     * Así controlamos cómo se crean las instancias
     */
    constructor(
        id: number,
        title: string,
        description: string | null,
        status: TaskStatus,
        priority: number,
        createdAt: Date,
        updatedAt: Date,
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Método de fábrica para crear nuevas tareas.
     * Garantiza que las nuevas tareas siempre tengan estado PENDING.
     *
     * @param title - Título de la tarea
     * @param description - Descripción opcional
     * @param priority - Prioridad (default: 1)
     */
    static create(
        title: string,
        description?: string,
        priority?: number,
    ): Task {
        const now = new Date();
        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            throw new BadRequestException('El título no puede estar vacío');
        }

        return new Task(
            0,                          // ID 0 = nueva tarea
            trimmedTitle,
            description ?? null,
            TaskStatus.PENDING,
            priority ?? 1,
            now,
            now,
        );
    }

    /**
     * Cambiar el estado de la tarea.
     * Incluye validación de reglas de negocio.
     *
     * REGLA: Una tarea completada no puede volver a estado pendiente.
     */
    changeStatus(newStatus: TaskStatus): void {
        // Validación de regla de negocio
        if (this.status === TaskStatus.COMPLETED && newStatus === TaskStatus.PENDING) {
            throw new BadRequestException(
                'Una tarea completada no puede volver a estado pendiente',
            );
        }
        this.status = newStatus;
        this.updatedAt = new Date();
    }

    /**
     * Actualizar el título de la tarea.
     * Incluye validación de negocio.
     */
    updateTitle(newTitle: string): void {
        const trimmedTitle = newTitle.trim();

        if (!trimmedTitle) {
            throw new BadRequestException('El título no puede estar vacío');
        }

        this.title = trimmedTitle;
        this.updatedAt = new Date();
    }

    /**
     * Verificar si la tarea es de alta prioridad.
     * Regla de negocio: prioridad >= 4 es alta prioridad.
     */
    isHighPriority(): boolean {
        return this.priority >= 4;
    }

    /**
     * Verificar si la tarea está completada.
     */
    isCompleted(): boolean {
        return this.status === TaskStatus.COMPLETED;
    }
}
```

**¿Por qué una clase y no un interface?**

1. **Encapsula comportamiento** - Los métodos contienen reglas de negocio
2. **Inmutabilidad controlada** - Solo se modifica a través de métodos específicos
3. **Validación centralizada** - Las reglas de negocio están en un solo lugar

### 2.3 Crear el Puerto (Interfaz del Repositorio)

```typescript
// src/tasks/domain/ports/task.repository.port.ts

import { Task } from '../task.entity';
import { TaskStatus } from '../task-status.enum';

/**
 * Puerto (Port) - Interfaz que define cómo nuestra aplicación
 * necesita interactuar con el persistencia de tareas.
 *
 * PRINCIPIO CLAVE:
 * El Dominio define qué necesita, no cómo lo hace.
 * Cualquier adaptador (TypeORM, MongoDB, en memoria, etc.)
 * debe implementar esta interfaz.
 */
export interface TaskRepositoryPort {
    /**
     * Obtener todas las tareas, opcionalmente filtradas por estado.
     */
    findAll(status?: TaskStatus): Promise<Task[]>;

    /**
     * Obtener una tarea por su ID.
     * Retorna null si no existe.
     */
    findById(id: number): Promise<Task | null>;

    /**
     * Guardar una tarea (crear o actualizar).
     * Retorna la tarea guardada con su ID.
     */
    save(task: Partial<Task>): Promise<Task>;

    /**
     * Eliminar una tarea por su ID.
     */
    delete(id: number): Promise<void>;

    /**
     * Contar tareas por estado específico.
     */
    countByStatus(status: TaskStatus): Promise<number>;

    /**
     * Contar todas las tareas.
     */
    countAll(): Promise<number>;
}
```

**¿Por qué una interfaz y no una clase?**

1. **Inversión de dependencias** - El Dominio no depende de implementaciones
2. **Flexibilidad** - Podemos cambiar la implementación sin cambiar el Dominio
3. **Testabilidad** - Podemos mockear fácilmente en tests

### 2.4 Crear el Barrel File (index.ts)

```typescript
// src/tasks/domain/index.ts

export * from './task-status.enum';
export * from './task.entity';
export * from './ports/task.repository.port';
```

**¿Qué es un barrel file?**

Es un archivo que re-exporta todos los módulos de una carpeta. Permite imports limpios:

```typescript
// En lugar de esto:
import { Task } from './domain/task.entity';
import { TaskStatus } from './domain/task-status.enum';

// Puedes hacer esto:
import { Task, TaskStatus } from 'tasks/domain';
```

---

## Paso 3: Crear la Capa de Aplicación (Use Cases)

### Explicación

Los **Use Cases** representan las operaciones que puede realizar el sistema. Cada use case es una clase que:
1. Coordina el flujo de datos
2. Llama a los ports (interfaces) para acceder a recursos externos
3. Aplica reglas de negocio
4. Retorna resultados

### 3.1 CreateTaskUseCase

```typescript
// src/tasks/application/use-cases/create-task.use-case.ts

import { Task } from '../../domain';
import { TaskRepositoryPort } from '../../domain';

/**
 * Caso de uso para crear una nueva tarea.
 *
 * RESPONSABILIDADES:
 * 1. Validar datos de entrada
 * 2. Aplicar reglas de negocio específicas (prioridad urgente)
 * 3. Delegar la persistencia al repositorio
 */
export class CreateTaskUseCase {
    constructor(private readonly taskRepository: TaskRepositoryPort) {}

    /**
     * Ejecutar la creación de tarea.
     *
     * REGLA DE NEGOCIO ESPECIAL:
     * Si el título contiene "urgente" (case insensitive),
     * la prioridad se eleva a 4 automáticamente.
     */
    async execute(dto: { title: string; description?: string; priority?: number }): Promise<Task> {
        // Determinar prioridad: si el título tiene "urgente", elevar a 4
        let finalPriority = dto.priority ?? 1;

        // Verificar si el título contiene "urgente" (case insensitive)
        const hasUrgentKeyword = /urgente/i.test(dto.title);

        if (hasUrgentKeyword && finalPriority < 4) {
            finalPriority = 4;
        }

        // Crear la tarea usando el factory del dominio
        const task = Task.create(dto.title, dto.description, finalPriority);

        // Persistir usando el repositorio (vía puerto)
        return this.taskRepository.save({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
        });
    }
}
```

### 3.2 GetTaskByIdUseCase

```typescript
// src/tasks/application/use-cases/get-task-by-id.use-case.ts

import { NotFoundException } from '@nestjs/common';
import { Task } from '../../domain';
import { TaskRepositoryPort } from '../../domain';

/**
 * Caso de uso para obtener una tarea por ID.
 */
export class GetTaskByIdUseCase {
    constructor(private readonly taskRepository: TaskRepositoryPort) {}

    async execute(id: number): Promise<Task> {
        // Buscar en el repositorio
        const task = await this.taskRepository.findById(id);

        // Si no existe, lanzar excepción de dominio
        if (!task) {
            throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
        }

        return task;
    }
}
```

### 3.3 GetTasksUseCase

```typescript
// src/tasks/application/use-cases/get-tasks.use-case.ts

import { Task } from '../../domain';
import { TaskRepositoryPort, TaskStatus } from '../../domain';

/**
 * Caso de uso para obtener todas las tareas.
 * Soporta filtrado opcional por estado.
 */
export class GetTasksUseCase {
    constructor(private readonly taskRepository: TaskRepositoryPort) {}

    async execute(status?: TaskStatus): Promise<Task[]> {
        return this.taskRepository.findAll(status);
    }
}
```

### 3.4 UpdateTaskUseCase

```typescript
// src/tasks/application/use-cases/update-task.use-case.ts

import { NotFoundException } from '@nestjs/common';
import { Task } from '../../domain';
import { TaskRepositoryPort } from '../../domain';

export class UpdateTaskUseCase {
    constructor(private readonly taskRepository: TaskRepositoryPort) {}

    async execute(
        id: number,
        dto: { title?: string; description?: string; status?: any; priority?: number }
    ): Promise<Task> {
        // Primero verificar que existe
        const task = await this.taskRepository.findById(id);

        if (!task) {
            throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
        }

        // Actualizar campos si se proporcionan
        if (dto.title !== undefined) {
            task.updateTitle(dto.title);
        }

        if (dto.status !== undefined) {
            task.changeStatus(dto.status);
        }

        if (dto.priority !== undefined) {
            task.priority = dto.priority;
            task.updatedAt = new Date();
        }

        // Guardar cambios
        return this.taskRepository.save({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
        });
    }
}
```

### 3.5 DeleteTaskUseCase

```typescript
// src/tasks/application/use-cases/delete-task.use-case.ts

import { NotFoundException } from '@nestjs/common';
import { TaskRepositoryPort } from '../../domain';

/**
 * Caso de uso para eliminar una tarea.
 */
export class DeleteTaskUseCase {
    constructor(private readonly taskRepository: TaskRepositoryPort) {}

    async execute(id: number): Promise<void> {
        // Verificar que existe
        const task = await this.taskRepository.findById(id);

        if (!task) {
            throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
        }

        // Eliminar
        await this.taskRepository.delete(id);
    }
}
```

### 3.6 GetTaskStatsUseCase

```typescript
// src/tasks/application/use-cases/get-task-stats.use-case.ts

import { TaskStatus } from '../../domain';
import { TaskRepositoryPort } from '../../domain';

/**
 * Caso de uso para obtener estadísticas de tareas.
 */
export class GetTaskStatsUseCase {
    constructor(private readonly taskRepository: TaskRepositoryPort) {}

    async execute(): Promise<{
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
    }> {
        const [total, pending, inProgress, completed] = await Promise.all([
            this.taskRepository.countAll(),
            this.taskRepository.countByStatus(TaskStatus.PENDING),
            this.taskRepository.countByStatus(TaskStatus.IN_PROGRESS),
            this.taskRepository.countByStatus(TaskStatus.COMPLETED),
        ]);

        return { total, pending, inProgress, completed };
    }
}
```

### 3.7 Crear el Barrel File de Use Cases

```typescript
// src/tasks/application/use-cases/index.ts

export * from './create-task.use-case';
export * from './get-task-by-id.use-case';
export * from './get-tasks.use-case';
export * from './update-task.use-case';
export * from './delete-task.use-case';
export * from './get-task-stats.use-case';
```

---

## Paso 4: Crear la Capa de Infraestructura

### Explicación

La capa de **Infraestructura** contiene los adaptadores que conectan nuestra aplicación con el mundo exterior (base de datos, APIs HTTP, etc.).

### 4.1 Crear la Entidad ORM (task.orm-entity.ts)

```typescript
// src/tasks/infrastructure/database/task.orm-entity.ts

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { TaskStatus } from 'tasks/domain';

/**
 * Entidad ORM - Mapeo con la tabla de la base de datos.
 *
 * Esta clase SÍ conoce de TypeORM (es un adaptador).
 * Mapea la entidad de dominio a la tabla de PostgreSQL.
 */
@Entity('tasks')
export class TaskOrmEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.PENDING,
    })
    status!: TaskStatus;

    @Column({ type: 'int', default: 1 })
    priority!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
```

**¿Por qué separar la entidad ORM de la entidad de dominio?**

```
┌─────────────────────────────────────────────────────────┐
│                    DOMAIN                               │
│  export class Task { ... }                              │
│  - Sin decorators                                       │
│  - Sin conocimiento de DB                               │
└─────────────────────────────────────────────────────────┘
                          │
                          │ mapping
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE                          │
│  @Entity() export class TaskOrmEntity { ... }           │
│  - Con decorators TypeORM                              │
│  - Mapea a tabla 'tasks'                               │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Crear el Repositorio (task.repository.ts)

```typescript
// src/tasks/infrastructure/database/task.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskRepositoryPort, TaskStatus } from 'tasks/domain';
import { TaskOrmEntity } from './task.orm-entity';

/**
 * Adaptador de Repositorio - Implementa el puerto para TypeORM.
 *
 * RESPONSABILIDADES:
 * 1. Traducir entre el mundo de dominio (Task) y ORM (TaskOrmEntity)
 * 2. Realizar operaciones de base de datos
 * 3. Mantener la interfaz del puerto
 */
@Injectable()
export class TaskRepository implements TaskRepositoryPort {
    constructor(
        @InjectRepository(TaskOrmEntity)
        private readonly repository: Repository<TaskOrmEntity>,
    ) {}

    async findAll(status?: TaskStatus): Promise<Task[]> {
        if (status) {
            const ormEntities = await this.repository.find({
                where: { status },
                order: { priority: 'DESC', createdAt: 'DESC' },
            });
            return ormEntities.map((entity) => this.toDomain(entity));
        }

        const ormEntities = await this.repository.find({
            order: { priority: 'DESC', createdAt: 'DESC' },
        });
        return ormEntities.map((entity) => this.toDomain(entity));
    }

    async findById(id: number): Promise<Task | null> {
        const ormEntity = await this.repository.findOne({ where: { id } });
        return ormEntity ? this.toDomain(ormEntity) : null;
    }

    async save(task: Partial<Task>): Promise<Task> {
        const ormEntity = this.repository.create({
            title: task.title!,
            description: task.description ?? null,
            status: task.status ?? TaskStatus.PENDING,
            priority: task.priority ?? 1,
        });

        const savedEntity = await this.repository.save(ormEntity);
        return this.toDomain(savedEntity);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }

    async countByStatus(status: TaskStatus): Promise<number> {
        return this.repository.count({ where: { status } });
    }

    async countAll(): Promise<number> {
        return this.repository.count();
    }

    /**
     * Mapper: Convierte entidad ORM a entidad de dominio.
     * Este método es crucial para mantener la separación de capas.
     */
    private toDomain(orm: TaskOrmEntity): Task {
        return new Task(
            orm.id,
            orm.title,
            orm.description,
            orm.status,
            orm.priority,
            orm.createdAt,
            orm.updatedAt,
        );
    }
}
```

### 4.3 Crear los DTOs de HTTP (task.dto.ts)

```typescript
// src/tasks/infrastructure/http/dto/task.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';
import { TaskStatus } from 'tasks/domain';

/**
 * DTO para crear una nueva tarea.
 * Usado en POST /tasks
 */
export class CreateTaskDto {
    @ApiProperty({ example: 'Terminar proyecto', description: 'Título de la tarea' })
    @IsString()
    @IsNotEmpty()
    title!: string;

    @ApiPropertyOptional({ example: 'Descripción opcional', description: 'Descripción de la tarea' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ example: 3, description: 'Prioridad (1-5)', minimum: 1, maximum: 5 })
    @IsOptional()
    @Min(1)
    @Max(5)
    priority?: number;
}

/**
 * DTO para actualizar una tarea existente.
 * Usado en PATCH /tasks/:id
 */
export class UpdateTaskDto {
    @ApiPropertyOptional({ example: 'Nuevo título' })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({ example: 'Nueva descripción' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ enum: TaskStatus, description: 'Estado de la tarea' })
    @IsEnum(TaskStatus)
    @IsOptional()
    status?: TaskStatus;

    @ApiPropertyOptional({ example: 4, description: 'Prioridad (1-5)', minimum: 1, maximum: 5 })
    @IsOptional()
    @Min(1)
    @Max(5)
    priority?: number;
}
```

### 4.4 Crear el Controlador (tasks.controller.ts)

```typescript
// src/tasks/infrastructure/http/tasks.controller.ts

import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UsePipes,
    ValidationPipe,
    ParseIntPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { TaskStatus } from 'tasks/domain';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import {
    GetTasksUseCase,
    GetTaskByIdUseCase,
    CreateTaskUseCase,
    UpdateTaskUseCase,
    DeleteTaskUseCase,
    GetTaskStatsUseCase,
} from 'tasks/application/use-cases';

@ApiTags('tasks')
@Controller('tasks')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class TasksController {
    constructor(
        private readonly getTasksUseCase: GetTasksUseCase,
        private readonly getTaskByIdUseCase: GetTaskByIdUseCase,
        private readonly createTaskUseCase: CreateTaskUseCase,
        private readonly updateTaskUseCase: UpdateTaskUseCase,
        private readonly deleteTaskUseCase: DeleteTaskUseCase,
        private readonly getTaskStatsUseCase: GetTaskStatsUseCase,
    ) {}

    @Get()
    @ApiOperation({ summary: 'Obtener todas las tareas' })
    @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
    @ApiResponse({ status: 200, description: 'Lista de tareas' })
    getAllTasks(@Query('status') status?: TaskStatus) {
        return this.getTasksUseCase.execute(status);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Obtener estadísticas de tareas' })
    @ApiResponse({ status: 200, description: 'Estadísticas totales' })
    getTaskStats() {
        return this.getTaskStatsUseCase.execute();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener una tarea por ID' })
    @ApiParam({ name: 'id', description: 'ID de la tarea', type: Number })
    @ApiResponse({ status: 200, description: 'Tarea encontrada' })
    @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
    getTaskById(@Param('id', ParseIntPipe) id: number) {
        return this.getTaskByIdUseCase.execute(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Crear una nueva tarea' })
    @ApiResponse({ status: 201, description: 'Tarea creada' })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    createTask(@Body() dto: CreateTaskDto) {
        return this.createTaskUseCase.execute(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar una tarea' })
    @ApiParam({ name: 'id', description: 'ID de la tarea', type: Number })
    @ApiResponse({ status: 200, description: 'Tarea actualizada' })
    @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
    updateTask(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
        return this.updateTaskUseCase.execute(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar una tarea' })
    @ApiParam({ name: 'id', description: 'ID de la tarea', type: Number })
    @ApiResponse({ status: 204, description: 'Tarea eliminada' })
    @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
    deleteTask(@Param('id', ParseIntPipe) id: number) {
        return this.deleteTaskUseCase.execute(id);
    }
}
```

### 4.5 Actualizar el Seeder (tasks.seeder.ts)

```typescript
// src/tasks/infrastructure/tasks.seeder.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskStatus } from 'tasks/domain';
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
            // ... más tareas
        ];

        await this.taskRepository.save(tasks);
        console.log('✅ Seed de tareas completado: 12 tareas creadas');
    }
}
```

---

## Paso 5: Configurar el Módulo

```typescript
// src/tasks/infrastructure/tasks.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskOrmEntity } from './database/task.orm-entity';
import { TaskRepository } from './database/task.repository';
import { TasksController } from './http/tasks.controller';
import {
    GetTasksUseCase,
    GetTaskByIdUseCase,
    CreateTaskUseCase,
    UpdateTaskUseCase,
    DeleteTaskUseCase,
    GetTaskStatsUseCase,
} from 'tasks/application/use-cases';
import { TasksSeeder } from './tasks.seeder';

/**
 * Token para identificar el repositorio en el contenedor DI.
 * Usamos un string token para mayor flexibilidad.
 */
export const TASK_REPOSITORY = 'TASK_REPOSITORY';

@Module({
    imports: [TypeOrmModule.forFeature([TaskOrmEntity])],
    controllers: [TasksController],
    providers: [
        // El repositorio (adaptador)
        TaskRepository,

        // Proveer el token con la implementación
        {
            provide: TASK_REPOSITORY,
            useExisting: TaskRepository,
        },

        // Casos de uso - inyectamos el token del repositorio
        {
            provide: GetTasksUseCase,
            useFactory: (taskRepository: TaskRepository) =>
                new GetTasksUseCase(taskRepository),
            inject: [TASK_REPOSITORY],
        },
        {
            provide: GetTaskByIdUseCase,
            useFactory: (taskRepository: TaskRepository) =>
                new GetTaskByIdUseCase(taskRepository),
            inject: [TASK_REPOSITORY],
        },
        {
            provide: CreateTaskUseCase,
            useFactory: (taskRepository: TaskRepository) =>
                new CreateTaskUseCase(taskRepository),
            inject: [TASK_REPOSITORY],
        },
        {
            provide: UpdateTaskUseCase,
            useFactory: (taskRepository: TaskRepository) =>
                new UpdateTaskUseCase(taskRepository),
            inject: [TASK_REPOSITORY],
        },
        {
            provide: DeleteTaskUseCase,
            useFactory: (taskRepository: TaskRepository) =>
                new DeleteTaskUseCase(taskRepository),
            inject: [TASK_REPOSITORY],
        },
        {
            provide: GetTaskStatsUseCase,
            useFactory: (taskRepository: TaskRepository) =>
                new GetTaskStatsUseCase(taskRepository),
            inject: [TASK_REPOSITORY],
        },

        // Seeder
        TasksSeeder,
    ],
})
export class TasksModule {}
```

---

## Paso 6: Actualizar app.module.ts

```typescript
// src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/infrastructure/tasks.module';
import { TaskOrmEntity } from './tasks/infrastructure/database/task.orm-entity';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST ?? 'localhost',
            port: parseInt(process.env.DB_PORT ?? '5432'),
            username: process.env.DB_USERNAME ?? 'postgres',
            password: process.env.DB_PASSWORD ?? 'postgres',
            database: process.env.DB_DATABASE ?? 'nest_tasks_db',
            entities: [TaskOrmEntity],
            synchronize: true,
        }),
        TasksModule,
    ],
})
export class AppModule {}
```

---

## Paso 7: Eliminar Archivos Antiguos

Una vez que todo esté funcionando, elimina los archivos de la estructura antigua:

```bash
# Eliminar archivos obsoletos
rm src/tasks/tasks.controller.ts
rm src/tasks/tasks.service.ts
rm src/tasks/tasks.service.spec.ts
rm src/tasks/tasks.controller.spec.ts
rm src/tasks/tasks.seeder.ts
rm src/tasks/tasks.module.ts
rm src/tasks/dto/task.dto.ts
rm src/tasks/entities/task.entity.ts

# Eliminar carpetas vacías
rmdir src/tasks/dto
rmdir src/tasks/entities
```

---

## Paso 8: Configurar Jest para Tests

### Actualizar tsconfig.json

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./src"
  }
}
```

### Actualizar package.json

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^tasks/(.*)$": "<rootDir>/tasks/$1"
    }
  }
}
```

---

## Paso 9: Verificar que Todo Funcione

### Build

```bash
npm run build
```

### Tests

```bash
npm run test
```

### Desarrollo

```bash
npm run start:dev
```

Accede a Swagger en: http://localhost:3000/api

---

## Paso 10: Crear Tests Unitarios

### Test de Entidad de Dominio

```typescript
// src/tasks/domain/task.entity.spec.ts

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
        });
    });

    describe('isHighPriority', () => {
        it('should return true for priority 4 or higher', () => {
            const taskHigh = new Task(1, 'Test', null, TaskStatus.PENDING, 4, now, now);
            const taskLow = new Task(1, 'Test', null, TaskStatus.PENDING, 3, now, now);

            expect(taskHigh.isHighPriority()).toBe(true);
            expect(taskLow.isHighPriority()).toBe(false);
        });
    });

    describe('create', () => {
        it('should create a task with default values', () => {
            const task = Task.create('New Task');

            expect(task.id).toBe(0);
            expect(task.title).toBe('New Task');
            expect(task.status).toBe(TaskStatus.PENDING);
            expect(task.priority).toBe(1);
        });

        it('should trim title on creation', () => {
            const task = Task.create('  Trimmed Title  ');
            expect(task.title).toBe('Trimmed Title');
        });
    });
});
```

### Test de CreateTaskUseCase

```typescript
// src/tasks/application/use-cases/create-task.use-case.spec.ts

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
    });

    it('should elevate priority to 4 (case insensitive)', async () => {
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
});
```

---

## Conclusión

### Resumen de lo Logrado

```
┌─────────────────────────────────────────────────────────────────┐
│                 ARQUITECTURA HEXAGONAL IMPLEMENTADA              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DOMAIN (src/tasks/domain/)                                     │
│  ├── task.entity.ts          ← Entidad pura de negocio          │
│  ├── task-status.enum.ts     ← Estados de negocio               │
│  ├── ports/task.repository.port.ts ← Interfaz del repositorio   │
│  └── index.ts                ← Barrel file                      │
│                                                                  │
│  APPLICATION (src/tasks/application/use-cases/)                 │
│  ├── create-task.use-case.ts  ← Crear tarea                     │
│  ├── get-task-by-id.use-case.ts ← Obtener por ID                │
│  ├── get-tasks.use-case.ts    ← Listar tareas                   │
│  ├── update-task.use-case.ts   ← Actualizar tarea               │
│  ├── delete-task.use-case.ts   ← Eliminar tarea                 │
│  └── get-task-stats.use-case.ts ← Estadísticas                  │
│                                                                  │
│  INFRASTRUCTURE (src/tasks/infrastructure/)                     │
│  ├── database/task.orm-entity.ts ← Entidad TypeORM             │
│  ├── database/task.repository.ts ← Implementación del repositorio│
│  ├── http/tasks.controller.ts  ← Controlador HTTP              │
│  ├── http/dto/task.dto.ts      ← DTOs de entrada                │
│  ├── tasks.module.ts           ← Módulo NestJS                  │
│  └── tasks.seeder.ts           ← Seeder de datos                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Beneficios Obtenidos

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Dependencias** | Acoplado a TypeORM | Dominio sin dependencias |
| **Testabilidad** | Tests dependen de DB | Tests con mocks simples |
| **Mantenimiento** | Cambios afectan todo | Cambios aislados por capa |
| **Flexibilidad** | Ligado a PostgreSQL | Fácil cambiar de DB |
| **Código limpio** | Mezcla de responsabilidades | Responsabilidades separadas |

### Comandos para Verificar

```bash
# Build
npm run build

# Tests
npm run test

# Desarrollo
npm run start:dev
# Abrir: http://localhost:3000/api
```

---

## Notas Adicionales

### Patrón de Inversión de Dependencias

```
                    ┌─────────────────┐
                    │    DOMAIN        │
                    │  (Define Ports)  │
                    └────────┬─────────┘
                             │
                             │ implementa
                             ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   APPLICATION   │──▶│    PORTS        │◀──│  INFRASTRUCTURE │
│  (Usa Ports)    │   │ (Interfaces)    │   │ (Implementa)    │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

### Principios SOLID Aplicados

1. **S** - Single Responsibility: Cada clase tiene una responsabilidad
2. **O** - Open/Closed: Abierto para extensión, cerrado para modificación
3. **L** - Liskov Substitution: Cualquier implementación es intercambiable
4. **I** - Interface Segregation: Puertos pequeños y específicos
5. **D** - Dependency Inversion: Depende de abstracciones, no de concreciones

### Próximos Pasos (Opcionales)

1. Agregar más tests de integración
2. Implementar un segundo adaptador (ej: MongoDB)
3. Agregar logging con un puerto de logger
4. Implementar auditoría con un puerto de eventos

---

¡Felicitaciones! Has migrado tu proyecto a Arquitectura Hexagonal. 🚀