// ============================================================
// IMPORTS - Librerías y módulos necesarios
// ============================================================
import {
  Body,                // Extrae el cuerpo (body) de la petición HTTP
  Controller,          // Decora la clase como un controlador
  Delete,             // Mapea peticiones DELETE
  Get,                // Mapea peticiones GET
  HttpCode,           // Permite cambiar el código de status HTTP
  HttpStatus,          // Enum con códigos HTTP (200, 201, 204, etc.)
  Param,              // Extrae parámetros de la URL (:id)
  Patch,              // Mapea peticiones PATCH (actualización parcial)
  Post,               // Mapea peticiones POST (crear)
  Query,              // Extrae query strings (?status=pending)
  UsePipes,           // Aplica pipes a nivel de controller
  ValidationPipe,     // Pipe built-in para validar datos contra DTOs
  ParseIntPipe,       // Pipe built-in que convierte strings a números
} from '@nestjs/common';

import {
  ApiTags,            // Agrupa endpoints en Swagger UI
  ApiOperation,       // Describe el endpoint en Swagger
  ApiResponse,        // Documenta las posibles respuestas HTTP
  ApiParam,           // Documenta parámetros de la URL
  ApiQuery,           // Documenta query strings
} from '@nestjs/swagger';

// Servicios y DTOs propios del módulo
import { TasksService } from './tasks.service';           // Lógica de negocio
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto'; // Define qué datos acepta
import { TaskStatus } from './entities/task.entity';      // Enum de estados

// ============================================================
// CONTROLLER - Define los endpoints de la API
// ============================================================
@ApiTags('tasks')  // Grupo "tasks" en Swagger UI (verás esto en /api)
@Controller('tasks')  // Ruta base: /tasks
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Valida todos los body
export class TasksController {

  // Inyección de dependencia: NestJS proporciona automáticamente el servicio
  constructor(private readonly tasksService: TasksService) {}

  // ============================================================
  // GET /tasks - Listar todas las tareas
  // ============================================================
  @Get()
  @ApiOperation({ summary: 'Obtener todas las tareas' })          // Título en Swagger
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus }) // Filtro opcional en Swagger
  @ApiResponse({ status: 200, description: 'Lista de tareas' })   // Documenta respuesta 200
  getAllTasks(@Query('status') status?: TaskStatus) {              // @Query extrae ?status=pending
    return this.tasksService.getTasks(status);
    // Llama al servicio, puede recibir un filtro de estado
  }

  // ============================================================
  // GET /tasks/stats - Estadísticas de tareas
  // ============================================================
  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de tareas' })
  @ApiResponse({ status: 200, description: 'Estadísticas totales' })
  getTaskStats() {
    return this.tasksService.getTaskStats();
    // Retorna: { total, pending, inProgress, completed }
  }

  // ============================================================
  // GET /tasks/:id - Obtener una tarea por ID
  // ============================================================
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una tarea por ID' })
  @ApiParam({ name: 'id', description: 'ID de la tarea', type: Number }) // Documenta el parámetro
  @ApiResponse({ status: 200, description: 'Tarea encontrada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  getTaskById(
    @Param('id', ParseIntPipe) id: number  // @Param extrae :id de la URL
  ) {                                      // ParseIntPipe convierte "5" string → 5 número
    return this.tasksService.getTaskById(id);
    // Si no existe, el servicio lanza NotFoundException (404)
  }

  // ============================================================
  // POST /tasks - Crear una nueva tarea
  // ============================================================
  @Post()
  @HttpCode(HttpStatus.CREATED)  // Cambia código de 200 a 201 (Created)
  @ApiOperation({ summary: 'Crear una nueva tarea' })
  @ApiResponse({ status: 201, description: 'Tarea creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  createTask(@Body() dto: CreateTaskDto) {
    // @Body extrae el JSON del cuerpo de la petición
    // dto viene validado contra CreateTaskDto (ValidationPipe)
    return this.tasksService.createTask(dto);
  }

  // ============================================================
  // PATCH /tasks/:id - Actualizar parcialmente una tarea
  // ============================================================
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una tarea' })
  @ApiParam({ name: 'id', description: 'ID de la tarea', type: Number })
  @ApiResponse({ status: 200, description: 'Tarea actualizada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) {
    // PATCH = actualización parcial (solo los campos que envíes)
    // Actualiza title, description, status y/o priority
    return this.tasksService.updateTask(id, dto);
  }

  // ============================================================
  // DELETE /tasks/:id - Eliminar una tarea
  // ============================================================
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)  // Código 204 (sin body en respuesta)
  @ApiOperation({ summary: 'Eliminar una tarea' })
  @ApiParam({ name: 'id', description: 'ID de la tarea', type: Number })
  @ApiResponse({ status: 204, description: 'Tarea eliminada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  deleteTask(@Param('id', ParseIntPipe) id: number) {
    // DELETE no retorna body, por eso @HttpCode(204)
    return this.tasksService.deleteTask(id);
  }
}
