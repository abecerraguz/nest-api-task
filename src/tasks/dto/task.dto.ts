import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, Min, Max, IsOptional } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({ example: 'Terminar documentación', description: 'Título de la tarea' })
  @IsString()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Completar el README con ejemplos', description: 'Descripción detallada', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1, description: 'Prioridad de 1 a 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  priority?: number;
}

export class UpdateTaskDto {
  @ApiProperty({ example: 'Nuevo título', description: 'Nuevo título', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Nueva descripción', description: 'Nueva descripción', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'in_progress', description: 'Estado de la tarea', enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ example: 3, description: 'Prioridad de 1 a 5' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;
}
