import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsEmail, MinLength } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Tarea 1', description: 'Name of the task' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 25, description: 'Age of the user' })
  @IsInt()
  age: number;

  @ApiProperty({ example: 'test@test.com', description: 'Email address' })
  @IsEmail()
  email: string;
}
