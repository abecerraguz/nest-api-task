import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsEmail,
  IsOptional,
  MinLength,
} from 'class-validator';

export class UpdateTaskDto {
  @ApiPropertyOptional({
    example: 'Tarea actualizada',
    description: 'Name of the task',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 30, description: 'Age of the user' })
  @IsOptional()
  @IsInt()
  age?: number;

  @ApiPropertyOptional({
    example: 'new@test.com',
    description: 'Email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
