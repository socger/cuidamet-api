import {
  IsString,
  MinLength,
  MaxLength,
  IsEmail,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Nombre de usuario único',
    example: 'johndoe',
    minLength: 3,
    maxLength: 50,
    type: String,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'Correo electrónico único del usuario',
    example: 'johndoe@example.com',
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
    example: 'SecurePass123',
    minLength: 6,
    maxLength: 255,
    type: String,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @ApiPropertyOptional({
    description: 'Nombre del usuario',
    example: 'John',
    maxLength: 100,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Doe',
    maxLength: 100,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    description: 'Tipo de perfil del usuario: provider (cuidador) o client (familiar)',
    example: 'provider',
    enum: ['provider', 'client'],
    type: String,
  })
  @IsString()
  @IsIn(['provider', 'client'], {
    message: 'El tipo de perfil debe ser "provider" o "client"',
  })
  profileType: 'provider' | 'client';
}
