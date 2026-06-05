import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../../../domain/task-status.enum';

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