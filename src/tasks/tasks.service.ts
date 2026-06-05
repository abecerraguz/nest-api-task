// ============================================================
// IMPORTS - Librerías necesarias
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
// Injectable: Decorador que marca la clase como un servicio inyectable
// NotFoundException: Excepción que retorna 404 cuando no se encuentra un recurso

/*
¿Qué significa "inyectable"?
La idea simpleImagina que en lugar de que tú mismo vayas a la cocina a preparar la comida, alguien te la trae a la mesa automáticamente.
SIN inyección de dependencias:
┌─────────────────────────────────────┐
│ Tú mismo creas las dependencias:    │
│                                     │
│  class Controller {                 │
│    constructor() {                  │
│      this.service = new Service();  │ ← Tú creas esto manualmente
│    }                                │
│  }                                  │
└─────────────────────────────────────┘
CON inyección de dependencias:
┌─────────────────────────────────────┐
│  NestJS te lo proporciona:          │
│                                     │
│  class Controller {                 │
│    constructor(service: Service) {  │  ← NestJS lo inyecta automáticamente
│      this.service = service;        │
│    }                                │
│  }                                  │
└─────────────────────────────────────┘
¿Por qué es útil?
Beneficio	Ejemplo
No creas objetos manualmente	new Service() → service
Código más limpio	Solo declaras lo que necesitas
Fácil de probar	Puedes "mockear" el servicio en tests
Reutilizable	El mismo service en muchos controllers
Orden controlado	NestJS asegura que las dependencias carguen primero
¿Cómo funciona?
┌─────────────────────────────────────────────────────────────┐
│                    NestJS Container                         │
│                                                             │
│  1. Lee el módulo (TasksModule)                             │
│  2. Ve que hay un servicio (TasksService)                   │
│  3. Ve que hay un controller (TasksController)              │
│  4. Detecta que el controller NECESITA el servicio          │
│  5. Crea una instancia del servicio                         │
│  6. La "inyecta" en el constructor del controller           │
│                                                             │
│  Resultado: El controller ya tiene el servicio listo        │
└─────────────────────────────────────────────────────────────┘

En código```typescript
// Lo que tú escribes:
@Injectable()
export class TasksService {}
// Lo que NESTS hace detrás:
const service = new TasksService(repository);
const controller = new TasksController(service);
Tú no llamas `new TasksService()`, **NestJS lo hace por ti**.

*/

import { InjectRepository } from '@nestjs/typeorm';
// InjectRepository: Permite injectar un repositorio de TypeORM

import { Repository } from 'typeorm';
// Repository: Tipo genérico para operaciones CRUD con una entidad específica

import { Task, TaskStatus } from './entities/task.entity';
// Task: Entidad que representa la tabla en la base de datos
// TaskStatus: Enum con los estados posibles de una tarea

import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
// CreateTaskDto: Define los campos requeridos para crear una tarea
// UpdateTaskDto: Define los campos opcionales para actualizar una tarea

// ============================================================
// @Injectable() - Marca esta clase como un servicio
// ============================================================
// Un servicio contiene la lógica de negocio
// Puede ser inyectado en otros servicios o controladores
@Injectable()
export class TasksService {
  // ============================================================
  // CONSTRUCTOR - Inyección de dependencias
  // ============================================================
  // Repository<Task>: Es el "cable" para comunicarnos con la tabla "tasks"
  // NestJS lo provee automáticamente gracias a TypeOrmModule.forFeature([Task])
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  // ============================================================
  // getTasks() - Listar todas las tareas
  // ============================================================
  // Busca TODAS las tareas en la base de datos
  async getTasks(status?: TaskStatus): Promise<Task[]> {
    // Si viene un estado como filtro, busca solo esas tareas
    if (status) {
      // WHERE status = 'pending' o 'in_progress' o 'completed'
      return this.taskRepository.find({ where: { status } });
    }

    // Si NO hay filtro, busca todas las tareas
    // ORDER BY priority DESC (mayor prioridad primero)
    // ORDER BY createdAt DESC (más recientes primero)
    return this.taskRepository.find({
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  // ============================================================
  // getTaskById() - Buscar una tarea por ID
  // ============================================================
  // Busca UNA tarea específica por su ID
  async getTaskById(id: number): Promise<Task> {
    // SELECT * FROM tasks WHERE id = id
    const task = await this.taskRepository.findOne({ where: { id } });

    // Si no existe la tarea, lanzamos un error 404
    // Esto hace que NestJS retorne automáticamente:
    // { statusCode: 404, message: "Tarea con ID ${id} no encontrada" }
    if (!task) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }

    // Si existe, la retornamos
    return task;
  }

  // ============================================================
  // createTask() - Crear una nueva tarea
  // ============================================================
  // Recibe un DTO con los datos y lo guarda en la base de datos
  async createTask(dto: CreateTaskDto): Promise<Task> {
    // taskRepository.create() → Crea una instancia del objeto Task
    // (aún NO la guarda en la base de datos)
    const task = this.taskRepository.create(dto);

    // taskRepository.save() → Guarda en la base de datos
    // Retorna la tarea ya guardada con el ID asignado
    return this.taskRepository.save(task);
  }

  // ============================================================
  // updateTask() - Actualizar una tarea existente
  // ============================================================
  // Busca la tarea, mezcla los datos nuevos con los actuales y guarda
  async updateTask(id: number, dto: UpdateTaskDto): Promise<Task> {
    // Primero verificamos que la tarea exista (o lanzamos 404)
    const task = await this.getTaskById(id);

    // Spread operator: mezcla la tarea existente con los datos nuevos
    // Ejemplo: { title: "Viejo", priority: 1 } + { title: "Nuevo" }
    // Resultado: { title: "Nuevo", priority: 1 }
    const updatedTask = { ...task, ...dto };

    // save() detecta que YA tiene ID, entonces hace UPDATE en vez de INSERT
    return this.taskRepository.save(updatedTask);
  }

  // ============================================================
  // deleteTask() - Eliminar una tarea
  // ============================================================
  // Busca la tarea y la elimina de la base de datos
  async deleteTask(id: number): Promise<void> {
    // Primero verificamos que exista (o lanzamos 404)
    const task = await this.getTaskById(id);

    // remove() elimina la tarea de la base de datos
    await this.taskRepository.remove(task);

    // No retorna nada (Promise<void>)
    // El controller maneja el código de respuesta (204 No Content)
  }

  // ============================================================
  // getTaskStats() - Obtener estadísticas
  // ============================================================
  // Cuenta cuántas tareas hay por cada estado
  async getTaskStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }> {
    // COUNT(*) → total de tareas
    const total = await this.taskRepository.count();

    // COUNT(*) WHERE status = 'pending'
    const pending = await this.taskRepository.count({
      where: { status: TaskStatus.PENDING },
    });

    // COUNT(*) WHERE status = 'in_progress'
    const inProgress = await this.taskRepository.count({
      where: { status: TaskStatus.IN_PROGRESS },
    });

    // COUNT(*) WHERE status = 'completed'
    const completed = await this.taskRepository.count({
      where: { status: TaskStatus.COMPLETED },
    });

    // Retorna un objeto con las estadísticas
    return { total, pending, inProgress, completed };
  }
}
