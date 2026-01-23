# 📘 Guía: Crear Nuevas Entidades con las Mejoras Implementadas

## 🎯 Resumen

Con las mejoras de base de datos implementadas (migraciones, soft deletes, auditoría), el proceso para crear nuevas entidades ha cambiado. Esta guía te muestra el flujo completo actualizado.

---

## ✅ Checklist Rápido

Al crear una nueva entidad, debes:

- [ ] 1. Extender de `BaseEntity` (auditoría y soft delete)
- [ ] 2. Agregar decoradores de Swagger en la entidad
- [ ] 3. Crear DTOs con decoradores de Swagger
- [ ] 4. Crear servicio con parámetros de auditoría (`createdBy`, `updatedBy`, `deletedBy`)
- [ ] 5. Crear controlador con `@UseGuards(JwtAuthGuard)` y `@Request() req`
- [ ] 6. Generar migración con TypeORM (NO usar synchronize)
- [ ] 7. Ejecutar la migración
- [ ] 8. (Opcional) Crear seeder con datos iniciales
- [ ] 9. Registrar entidad en `database.config.ts`

---

## 📋 Flujo Completo Paso a Paso

### **Paso 1: Crear la Entidad**

La entidad **DEBE extender de `BaseEntity`** para tener auditoría y soft delete automáticamente:

```typescript
// src/entities/vehicle.entity.ts
import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  // ❌ NO hacer esto: @PrimaryGeneratedColumn() id: number;
  // ❌ NO hacer esto: @CreateDateColumn() createdAt: Date;
  // ✅ BaseEntity ya incluye: id, createdAt, updatedAt, deletedAt, createdBy, updatedBy, deletedBy

  @Column({ unique: true, length: 20 })
  @ApiProperty({ 
    description: 'Matrícula del vehículo', 
    example: 'ABC1234',
    uniqueItems: true 
  })
  plate: string;

  @Column({ length: 100 })
  @ApiProperty({ 
    description: 'Modelo del vehículo', 
    example: 'Tesla Model 3' 
  })
  model: string;

  @Column({ type: 'int' })
  @ApiProperty({ 
    description: 'Año de fabricación', 
    example: 2023,
    minimum: 1900,
    maximum: 2100
  })
  year: number;

  @Column({ name: 'is_active', default: true })
  @ApiProperty({ 
    description: 'Estado del vehículo', 
    example: true,
    default: true
  })
  isActive: boolean;
}
```

#### ⚠️ **IMPORTANTE: NO incluir estos campos**
Ya están en `BaseEntity`:
- ❌ `id`
- ❌ `createdAt`
- ❌ `updatedAt`
- ❌ `deletedAt` ✨ NUEVO
- ❌ `createdBy` ✨ NUEVO
- ❌ `updatedBy` ✨ NUEVO
- ❌ `deletedBy` ✨ NUEVO

---

### **Paso 2: Crear DTOs con Swagger**

#### **CreateDto**

```typescript
// src/vehicles/dto/create-vehicle.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, IsOptional, Length, Min, Max } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({
    description: 'Matrícula del vehículo',
    example: 'ABC1234',
    minLength: 5,
    maxLength: 20,
  })
  @IsString()
  @Length(5, 20)
  plate: string;

  @ApiProperty({
    description: 'Modelo del vehículo',
    example: 'Tesla Model 3',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  model: string;

  @ApiProperty({
    description: 'Año de fabricación',
    example: 2023,
    minimum: 1900,
    maximum: 2100,
  })
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @ApiProperty({
    description: 'Estado del vehículo',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

#### **UpdateDto**

⚠️ **IMPORTANTE: Usar `PartialType` de `@nestjs/swagger`**, NO de `@nestjs/mapped-types`:

```typescript
// src/vehicles/dto/update-vehicle.dto.ts
import { PartialType } from '@nestjs/swagger'; // ✅ De @nestjs/swagger
// import { PartialType } from '@nestjs/mapped-types'; // ❌ NO usar este

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
```

#### **FiltersDto (si necesitas filtros)**

```typescript
// src/vehicles/dto/vehicle-filters.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsBoolean } from 'class-validator';

export class VehicleFiltersDto {
  @ApiPropertyOptional({ description: 'Búsqueda general', example: 'Tesla' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por matrícula', example: 'ABC' })
  @IsOptional()
  @IsString()
  plate?: string;

  @ApiPropertyOptional({ description: 'Filtrar por modelo', example: 'Model 3' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Año mínimo', example: 2020 })
  @IsOptional()
  @IsInt()
  minYear?: number;

  @ApiPropertyOptional({ description: 'Estado activo', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: 'Campo para ordenar',
    enum: ['plate', 'model', 'year', 'createdAt'],
    example: 'createdAt' 
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ 
    description: 'Orden',
    enum: ['ASC', 'DESC'],
    example: 'DESC' 
  })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';
}
```

---

### **Paso 3: Crear el Servicio**

El servicio **DEBE incluir parámetros opcionales** para auditoría:

```typescript
// src/vehicles/vehicles.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  // ✅ IMPORTANTE: Agregar parámetro createdBy
  async create(createVehicleDto: CreateVehicleDto, createdBy?: number): Promise<Vehicle> {
    // Validar duplicados
    const existing = await this.vehicleRepository.findOne({
      where: { plate: createVehicleDto.plate },
    });

    if (existing) {
      throw new ConflictException(`La matrícula ${createVehicleDto.plate} ya existe`);
    }

    // Crear con información de auditoría
    const vehicle = this.vehicleRepository.create({
      ...createVehicleDto,
      createdBy, // ✨ Auditoría
    });

    return this.vehicleRepository.save(vehicle);
  }

  // ✅ IMPORTANTE: Agregar parámetro updatedBy
  async update(id: number, updateVehicleDto: UpdateVehicleDto, updatedBy?: number): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    // Validar duplicados si se cambia la matrícula
    if (updateVehicleDto.plate && updateVehicleDto.plate !== vehicle.plate) {
      const existing = await this.vehicleRepository.findOne({
        where: { plate: updateVehicleDto.plate },
      });
      
      if (existing) {
        throw new ConflictException(`La matrícula ${updateVehicleDto.plate} ya existe`);
      }
    }

    Object.assign(vehicle, updateVehicleDto);
    
    if (updatedBy) {
      vehicle.updatedBy = updatedBy; // ✨ Auditoría
    }

    return this.vehicleRepository.save(vehicle);
  }

  // ✅ IMPORTANTE: Agregar parámetro deletedBy para soft delete
  async remove(id: number, deletedBy?: number): Promise<void> {
    const vehicle = await this.findOne(id);

    if (deletedBy) {
      vehicle.deletedBy = deletedBy; // ✨ Auditoría
    }

    await this.vehicleRepository.softRemove(vehicle); // ✨ Soft delete
    // ❌ NO usar: await this.vehicleRepository.remove(vehicle);
  }

  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    
    if (!vehicle) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    }
    
    return vehicle;
  }

  async findAll(): Promise<Vehicle[]> {
    // Por defecto, TypeORM excluye registros con deletedAt != null
    return this.vehicleRepository.find();
  }

  // Método para ver registros eliminados (opcional)
  async findAllWithDeleted(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({ withDeleted: true });
  }
}
```

---

### **Paso 4: Crear el Controlador**

El controlador **DEBE usar `@UseGuards(JwtAuthGuard)` y `@Request()`** para operaciones que requieren auditoría:

```typescript
// src/vehicles/vehicles.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar vehículos' })
  @ApiResponse({ status: 200, description: 'Lista obtenida exitosamente' })
  async findAll() {
    return {
      message: 'Lista de vehículos obtenida exitosamente',
      data: await this.vehiclesService.findAll(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener vehículo por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Vehículo obtenido' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Vehículo obtenido exitosamente',
      data: await this.vehiclesService.findOne(id),
    };
  }

  // ✅ IMPORTANTE: Usar @UseGuards y @Request para auditoría
  @Post()
  @UseGuards(JwtAuthGuard) // ✨ Requiere autenticación
  @ApiBearerAuth() // ✨ Swagger: requiere token
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear vehículo' })
  @ApiResponse({ status: 201, description: 'Vehículo creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Matrícula ya existe' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async create(
    @Body() createVehicleDto: CreateVehicleDto,
    @Request() req, // ✨ Obtener usuario autenticado
  ) {
    const createdBy = req.user?.userId; // ✨ Extraer userId
    return {
      message: 'Vehículo creado exitosamente',
      data: await this.vehiclesService.create(createVehicleDto, createdBy),
    };
  }

  // ✅ IMPORTANTE: Usar @UseGuards y @Request para auditoría
  @Patch(':id')
  @UseGuards(JwtAuthGuard) // ✨ Requiere autenticación
  @ApiBearerAuth() // ✨ Swagger: requiere token
  @ApiOperation({ summary: 'Actualizar vehículo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Request() req, // ✨ Obtener usuario autenticado
  ) {
    const updatedBy = req.user?.userId; // ✨ Extraer userId
    return {
      message: 'Vehículo actualizado exitosamente',
      data: await this.vehiclesService.update(id, updateVehicleDto, updatedBy),
    };
  }

  // ✅ IMPORTANTE: Usar @UseGuards y @Request para auditoría
  @Delete(':id')
  @UseGuards(JwtAuthGuard) // ✨ Requiere autenticación
  @ApiBearerAuth() // ✨ Swagger: requiere token
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Eliminar vehículo (soft delete)',
    description: 'Eliminación lógica. El vehículo se marca como eliminado pero no se borra físicamente.'
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Vehículo eliminado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req, // ✨ Obtener usuario autenticado
  ) {
    const deletedBy = req.user?.userId; // ✨ Extraer userId
    await this.vehiclesService.remove(id, deletedBy);
    return { message: 'Vehículo eliminado exitosamente' };
  }
}
```

---

### **Paso 5: Crear el Módulo**

```typescript
// src/vehicles/vehicles.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { Vehicle } from '../entities/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
```

---

### **Paso 6: Registrar en AppModule**

```typescript
// src/app.module.ts
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    // ... otros imports
    VehiclesModule, // ✨ Agregar
  ],
})
export class AppModule {}
```

---

### **Paso 7: Registrar en database.config.ts**

```typescript
// src/database/database.config.ts
import { Vehicle } from '../entities/vehicle.entity'; // ✨ Importar

export const databaseConfig = (): TypeOrmModuleOptions => ({
  // ...
  entities: [
    User, 
    Role, 
    RefreshToken, 
    PasswordHistory, 
    VerificationToken,
    Vehicle, // ✨ Agregar
  ],
  // ...
});
```

---

### **Paso 8: Generar y Ejecutar Migración**

⚠️ **MUY IMPORTANTE**: Ahora **NO puedes usar `synchronize: true`**. Debes crear migraciones:

```bash
# 1. Generar migración (TypeORM detecta los cambios)
npm run migration:generate -- src/database/migrations/AddVehicleEntity

# 2. Revisar la migración generada en src/database/migrations/

# 3. Ejecutar la migración
npm run migration:run

# 4. Verificar estado
npm run migration:show
```

La migración generada será algo como:

```typescript
// src/database/migrations/1737159000000-AddVehicleEntity.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVehicleEntity1737159000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`vehicles\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`plate\` varchar(20) NOT NULL,
                \`model\` varchar(100) NOT NULL,
                \`year\` int NOT NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                \`created_by\` int NULL,
                \`updated_by\` int NULL,
                \`deleted_by\` int NULL,
                UNIQUE INDEX \`IDX_plate\` (\`plate\`),
                INDEX \`IDX_deleted_at\` (\`deleted_at\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_deleted_at\` ON \`vehicles\``);
        await queryRunner.query(`DROP INDEX \`IDX_plate\` ON \`vehicles\``);
        await queryRunner.query(`DROP TABLE \`vehicles\``);
    }
}
```

---

### **Paso 9: (Opcional) Crear Seeder**

Si necesitas datos iniciales:

```typescript
// src/database/seeds/vehicle.seeder.ts
import { AppDataSource } from '../data-source';
import { Vehicle } from '../../entities/vehicle.entity';

export class VehicleSeeder {
  public async run(): Promise<void> {
    const vehicleRepository = AppDataSource.getRepository(Vehicle);

    const vehicles = [
      { plate: 'ABC1234', model: 'Tesla Model 3', year: 2023, isActive: true },
      { plate: 'DEF5678', model: 'BMW X5', year: 2022, isActive: true },
      { plate: 'GHI9012', model: 'Audi A4', year: 2021, isActive: true },
    ];

    for (const vehicleData of vehicles) {
      const existing = await vehicleRepository.findOne({
        where: { plate: vehicleData.plate },
      });

      if (!existing) {
        const vehicle = vehicleRepository.create(vehicleData);
        await vehicleRepository.save(vehicle);
        console.log(`✅ Vehículo creado: ${vehicleData.plate}`);
      } else {
        console.log(`ℹ️  Vehículo ya existe: ${vehicleData.plate}`);
      }
    }
  }
}
```

Y registrarlo en `run-seeders.ts`:

```typescript
// src/database/seeds/run-seeders.ts
import { VehicleSeeder } from './vehicle.seeder';

// ...después de los otros seeders
console.log('🚗 Ejecutando Vehicle Seeder...');
const vehicleSeeder = new VehicleSeeder();
await vehicleSeeder.run();
```

---

## ⚠️ Errores Comunes a Evitar

### ❌ **Error 1: No extender de BaseEntity**

```typescript
// ❌ MAL
@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;
  
  @CreateDateColumn()
  createdAt: Date;
  // ...
}

// ✅ BIEN
@Entity('vehicles')
export class Vehicle extends BaseEntity {
  // No incluir id, createdAt, etc.
}
```

### ❌ **Error 2: Olvidar parámetros de auditoría en servicios**

```typescript
// ❌ MAL
async create(dto: CreateVehicleDto): Promise<Vehicle> {
  const vehicle = this.repository.create(dto);
  return this.repository.save(vehicle);
}

// ✅ BIEN
async create(dto: CreateVehicleDto, createdBy?: number): Promise<Vehicle> {
  const vehicle = this.repository.create({ ...dto, createdBy });
  return this.repository.save(vehicle);
}
```

### ❌ **Error 3: No usar @UseGuards en operaciones de escritura**

```typescript
// ❌ MAL
@Post()
async create(@Body() dto: CreateVehicleDto) {
  return this.service.create(dto); // Sin createdBy
}

// ✅ BIEN
@Post()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async create(@Body() dto: CreateVehicleDto, @Request() req) {
  const createdBy = req.user?.userId;
  return this.service.create(dto, createdBy);
}
```

### ❌ **Error 4: Usar remove() en lugar de softRemove()**

```typescript
// ❌ MAL - Borra físicamente el registro
await this.repository.remove(vehicle);

// ✅ BIEN - Soft delete (recuperable)
await this.repository.softRemove(vehicle);
```

### ❌ **Error 5: Usar PartialType incorrecto en UpdateDto**

```typescript
// ❌ MAL
import { PartialType } from '@nestjs/mapped-types';

// ✅ BIEN
import { PartialType } from '@nestjs/swagger';
```

### ❌ **Error 6: Olvidar agregar @Request() en controlador**

```typescript
// ❌ MAL - No hay forma de obtener userId
@Patch(':id')
@UseGuards(JwtAuthGuard)
async update(@Param('id') id: number, @Body() dto: UpdateDto) {
  return this.service.update(id, dto); // updatedBy será undefined
}

// ✅ BIEN
@Patch(':id')
@UseGuards(JwtAuthGuard)
async update(@Param('id') id: number, @Body() dto: UpdateDto, @Request() req) {
  return this.service.update(id, dto, req.user?.userId);
}
```

---

## 🚀 Comandos Finales

```bash
# 1. Generar migración
npm run migration:generate -- src/database/migrations/AddVehicleEntity

# 2. Ejecutar migración
npm run migration:run

# 3. (Opcional) Ejecutar seeders
npm run seed:run

# 4. Reiniciar app
npm run start:dev

# 5. Probar en Swagger
# http://localhost:3000/api/docs
```

---

## 📊 Resumen Visual

```
Nueva Entidad
    ↓
Extender BaseEntity ✨
    ↓
Crear DTOs con Swagger
    ↓
Crear Servicio (con createdBy, updatedBy, deletedBy)
    ↓
Crear Controlador (@UseGuards, @Request)
    ↓
Registrar en AppModule y database.config
    ↓
Generar Migración ✨
    ↓
Ejecutar Migración ✨
    ↓
(Opcional) Crear Seeder ✨
    ↓
¡Listo! 🎉
```

---

## 💡 Consejos Adicionales

1. **Siempre revisa la migración generada** antes de ejecutarla
2. **Prueba primero en desarrollo** antes de aplicar en producción
3. **Documenta bien en Swagger** - ayuda a otros desarrolladores
4. **Mantén consistencia** en nombres y estructura
5. **Usa validaciones en DTOs** - previene datos inválidos
6. **Implementa filtros** si la entidad lo necesita
7. **Considera relaciones** con otras entidades desde el principio

---

<div align="center">
  <p><strong>🎯 Con esta guía, todas tus nuevas entidades tendrán:</strong></p>
  <p>✅ Soft Deletes | ✅ Auditoría Completa | ✅ Migraciones Versionadas | ✅ Documentación Swagger</p>
</div>
