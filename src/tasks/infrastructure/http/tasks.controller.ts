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