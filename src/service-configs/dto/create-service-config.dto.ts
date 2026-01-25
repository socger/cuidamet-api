import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceConfigDto {
  @ApiProperty({
    description: 'ID del proveedor que ofrece este servicio',
    example: 1,
  })
  @IsNotEmpty({ message: 'El ID del proveedor es obligatorio' })
  @IsNumber({}, { message: 'El ID del proveedor debe ser un número' })
  providerId: number;

  @ApiProperty({
    description: 'Categoría del servicio de cuidado',
    enum: ['Elderly Care', 'Child Care', 'Pet Care', 'Home Cleaning'],
    example: 'Elderly Care',
  })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @IsString({ message: 'La categoría debe ser texto' })
  @IsEnum(['Elderly Care', 'Child Care', 'Pet Care', 'Home Cleaning'], {
    message: 'Categoría inválida',
  })
  careCategory: string;

  @ApiPropertyOptional({
    description: 'Indica si la configuración está completa',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'completed debe ser verdadero o falso' })
  completed?: boolean;

  @ApiPropertyOptional({
    description: 'Tareas específicas que ofrece',
    example: ['Gestión de Medicamentos', 'Compañía', 'Asistencia en Movilidad'],
    type: [String],
    maxItems: 50,
  })
  @IsOptional()
  @IsArray({ message: 'Las tareas deben ser un array' })
  @IsString({ each: true, message: 'Cada tarea debe ser texto' })
  @ArrayMaxSize(50, { message: 'Máximo 50 tareas' })
  tasks?: string[];

  @ApiProperty({
    description: 'Tarifa por hora base en euros',
    example: 15.00,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'La tarifa por hora es obligatoria' })
  @IsNumber({}, { message: 'La tarifa debe ser un número' })
  @Min(0, { message: 'La tarifa no puede ser negativa' })
  hourlyRate: number;

  @ApiPropertyOptional({
    description: 'Tarifa por turno o servicio completo',
    example: 100.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La tarifa de turno debe ser un número' })
  @Min(0, { message: 'La tarifa de turno no puede ser negativa' })
  shiftRate?: number;

  @ApiPropertyOptional({
    description: 'Recargo por urgencia (porcentaje)',
    example: 20.00,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El recargo debe ser un número' })
  @Min(0, { message: 'El recargo mínimo es 0%' })
  @Max(100, { message: 'El recargo máximo es 100%' })
  urgentSurcharge?: number;

  @ApiPropertyOptional({
    description: 'Descripción detallada del servicio',
    example: 'Como enfermera con 10 años de experiencia geriátrica...',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Años de experiencia',
    example: '5-10 años',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'La experiencia debe ser texto' })
  @MaxLength(50, { message: 'Máximo 50 caracteres' })
  experience?: string;

  @ApiPropertyOptional({
    description: 'Disponibilidad para este servicio',
    example: ['Mañanas', 'Tardes', 'Fines de semana'],
    type: [String],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray({ message: 'La disponibilidad debe ser un array' })
  @IsString({ each: true, message: 'Cada disponibilidad debe ser texto' })
  @ArrayMaxSize(20, { message: 'Máximo 20 disponibilidades' })
  availability?: string[];

  @ApiPropertyOptional({
    description: 'Hora de inicio del horario (HH:MM:SS)',
    example: '08:00:00',
  })
  @IsOptional()
  @IsString({ message: 'La hora de inicio debe ser texto' })
  scheduleStart?: string;

  @ApiPropertyOptional({
    description: 'Hora de fin del horario (HH:MM:SS)',
    example: '18:00:00',
  })
  @IsOptional()
  @IsString({ message: 'La hora de fin debe ser texto' })
  scheduleEnd?: string;

  @ApiPropertyOptional({
    description: 'Fechas específicas de disponibilidad (YYYY-MM-DD)',
    example: ['2024-01-15', '2024-01-16'],
    type: [String],
    maxItems: 100,
  })
  @IsOptional()
  @IsArray({ message: 'Las fechas deben ser un array' })
  @IsString({ each: true, message: 'Cada fecha debe ser texto' })
  @ArrayMaxSize(100, { message: 'Máximo 100 fechas' })
  specificDates?: string[];

  @ApiPropertyOptional({
    description: 'Formación específica',
    example: 'Máster en Geriatría, Curso de Alzheimer',
  })
  @IsOptional()
  @IsString({ message: 'La formación debe ser texto' })
  training?: string;

  @ApiPropertyOptional({
    description: 'Habilidades médicas (para cuidado de mayores)',
    example: ['Alzheimer', 'Parkinson', 'Diabetes'],
    type: [String],
    maxItems: 30,
  })
  @IsOptional()
  @IsArray({ message: 'Las habilidades deben ser un array' })
  @IsString({ each: true, message: 'Cada habilidad debe ser texto' })
  @ArrayMaxSize(30, { message: 'Máximo 30 habilidades' })
  medicalSkills?: string[];

  @ApiPropertyOptional({
    description: 'Tipos de mascotas aceptadas (para Pet Care)',
    example: ['Perros', 'Gatos'],
    type: [String],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray({ message: 'Las mascotas deben ser un array' })
  @IsString({ each: true, message: 'Cada mascota debe ser texto' })
  @ArrayMaxSize(20, { message: 'Máximo 20 tipos de mascotas' })
  acceptedPets?: string[];

  @ApiPropertyOptional({
    description: 'Zonas de trabajo para mascotas',
    example: ['A domicilio', 'En casa del cuidador'],
    type: [String],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray({ message: 'Las zonas deben ser un array' })
  @IsString({ each: true, message: 'Cada zona debe ser texto' })
  @ArrayMaxSize(10, { message: 'Máximo 10 zonas' })
  petWorkZones?: string[];

  @ApiPropertyOptional({
    description: 'Número máximo de mascotas',
    example: 3,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El máximo de mascotas debe ser un número' })
  @Min(1, { message: 'Mínimo 1 mascota' })
  maxPets?: number;

  @ApiPropertyOptional({
    description: 'Quien proporciona productos de limpieza (para Home Cleaning)',
    enum: ['provider', 'client', 'flexible'],
    example: 'flexible',
  })
  @IsOptional()
  @IsString({ message: 'cleaningProducts debe ser texto' })
  @IsEnum(['provider', 'client', 'flexible'], {
    message: 'Valor inválido para cleaningProducts',
  })
  cleaningProducts?: string;

  @ApiPropertyOptional({
    description: 'Dispone de equipo propio',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'hasEquipment debe ser verdadero o falso' })
  hasEquipment?: boolean;

  @ApiPropertyOptional({
    description: 'Incluye gestión de residuos',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'wasteManagement debe ser verdadero o falso' })
  wasteManagement?: boolean;

  @ApiPropertyOptional({
    description: 'Usa productos ecológicos',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'ecoFriendly debe ser verdadero o falso' })
  ecoFriendly?: boolean;
}
