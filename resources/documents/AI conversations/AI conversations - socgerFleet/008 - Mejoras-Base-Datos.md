# 🗄️ Mejoras de Base de Datos

Este documento describe las mejoras implementadas en la base de datos del proyecto SocgerFleet para mejorar la trazabilidad, seguridad y mantenibilidad.

## 📋 Índice

- [Migraciones TypeORM](#migraciones-typeorm)
- [Soft Deletes](#soft-deletes)
- [Auditoría](#auditoría)
- [Seeders](#seeders)

---

## 🔄 Migraciones TypeORM

Las migraciones permiten versionar y gestionar los cambios en el esquema de la base de datos de forma controlada.

### **Configuración**

Las migraciones están configuradas en:
- **Data Source**: [`src/database/data-source.ts`](../src/database/data-source.ts)
- **Configuración**: [`src/database/database.config.ts`](../src/database/database.config.ts)
- **Directorio**: [`src/database/migrations/`](../src/database/migrations/)

### **⚠️ IMPORTANTE**

`synchronize` está en `false` en la configuración de TypeORM. Esto es **CRÍTICO** cuando usas migraciones para evitar que TypeORM modifique automáticamente el esquema.

### **Comandos Disponibles**

```bash
# Generar una nueva migración basada en cambios en las entidades
npm run migration:generate -- src/database/migrations/NombreMigracion

# Crear una migración vacía manualmente
npm run migration:create -- src/database/migrations/NombreMigracion

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir la última migración
npm run migration:revert

# Ver estado de las migraciones
npm run migration:show
```

### **Flujo de Trabajo**

1. **Modificar entidades** según necesidades
2. **Generar migración**:
   ```bash
   npm run migration:generate -- src/database/migrations/AddNewFeature
   ```
3. **Revisar migración** generada en `src/database/migrations/`
4. **Ejecutar migración**:
   ```bash
   npm run migration:run
   ```
5. **Compilar proyecto** para producción:
   ```bash
   npm run build
   ```

### **Ejemplo de Migración**

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      ADD COLUMN \`email_verified\` tinyint NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      DROP COLUMN \`email_verified\`
    `);
  }
}
```

### **Buenas Prácticas**

✅ **Hacer:**
- Revisar siempre la migración generada antes de ejecutarla
- Implementar el método `down()` para poder revertir cambios
- Probar migraciones en desarrollo antes de producción
- Hacer commit de las migraciones con el código relacionado
- Usar nombres descriptivos para las migraciones

❌ **Evitar:**
- Modificar migraciones ya ejecutadas en producción
- Tener `synchronize: true` con migraciones
- Ejecutar `migration:run` sin revisar primero con `migration:show`
- Eliminar archivos de migración ya ejecutados

---

## 🗑️ Soft Deletes

El **soft delete** (borrado lógico) marca registros como eliminados sin borrarlos físicamente de la base de datos.

### **Implementación**

Todas las entidades extienden de [`BaseEntity`](../src/entities/base.entity.ts) que incluye:

```typescript
@DeleteDateColumn({ name: 'deleted_at', nullable: true })
deletedAt: Date;

@Column({ name: 'deleted_by', nullable: true })
deletedBy: number;
```

### **Ventajas**

- 📊 **Trazabilidad completa** - Mantiene histórico de registros
- 🔙 **Recuperación de datos** - Posibilidad de restaurar registros
- 📈 **Análisis** - Permite analizar patrones de eliminación
- ⚖️ **Cumplimiento legal** - Facilita auditorías y cumplimiento normativo

### **Uso en Servicios**

```typescript
// Soft delete
await this.userRepository.softRemove(user);

// Restaurar registro eliminado
await this.userRepository.recover(user);

// Buscar incluyendo eliminados
await this.userRepository.find({ withDeleted: true });

// Buscar solo eliminados
await this.userRepository.find({
  where: { deletedAt: Not(IsNull()) },
  withDeleted: true,
});
```

### **Ejemplo Real**

En [`users.service.ts`](../src/users/users.service.ts):

```typescript
async remove(id: number, deletedBy?: number): Promise<void> {
  const user = await this.findOne(id);
  
  // Soft delete con información de auditoría
  if (deletedBy) {
    user.deletedBy = deletedBy;
  }
  
  await this.userRepository.softRemove(user);
}
```

### **Consultas con Soft Delete**

Por defecto, TypeORM **excluye automáticamente** registros con `deleted_at` no nulo:

```typescript
// Solo registros activos (deleted_at = NULL)
await this.userRepository.find();

// Incluir registros eliminados
await this.userRepository.find({ withDeleted: true });

// Solo registros eliminados
await this.userRepository
  .createQueryBuilder('user')
  .withDeleted()
  .where('user.deleted_at IS NOT NULL')
  .getMany();
```

---

## 🔍 Auditoría

Sistema completo de auditoría que registra quién creó, modificó y eliminó cada registro.

### **Campos de Auditoría**

Implementados en [`BaseEntity`](../src/entities/base.entity.ts):

```typescript
@Column({ name: 'created_by', nullable: true })
createdBy: number;

@Column({ name: 'updated_by', nullable: true })
updatedBy: number;

@Column({ name: 'deleted_by', nullable: true })
deletedBy: number;

@CreateDateColumn({ name: 'created_at' })
createdAt: Date;

@UpdateDateColumn({ name: 'updated_at' })
updatedAt: Date;

@DeleteDateColumn({ name: 'deleted_at', nullable: true })
deletedAt: Date;
```

### **Ventajas**

- 👤 **Trazabilidad de usuarios** - Saber quién hizo cada cambio
- 📅 **Timestamps automáticos** - Cuándo ocurrió cada acción
- 🔐 **Seguridad** - Detectar acciones no autorizadas
- 📋 **Cumplimiento** - Auditorías legales y normativas

### **Uso en Controladores**

Los controladores extraen el ID del usuario autenticado y lo pasan a los servicios:

```typescript
@Post()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async create(
  @Body() createUserDto: CreateUserDto,
  @Request() req,
) {
  const createdBy = req.user?.userId;
  return await this.usersService.create(createUserDto, createdBy);
}
```

### **Consultas de Auditoría**

```typescript
// Obtener registros creados por un usuario específico
await this.userRepository.find({
  where: { createdBy: userId }
});

// Obtener registros modificados recientemente
await this.userRepository.find({
  where: {
    updatedAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000))
  }
});

// Obtener registros eliminados por un usuario
await this.userRepository.find({
  where: { deletedBy: userId },
  withDeleted: true
});
```

### **Reportes de Auditoría**

Ejemplo de consulta para generar un reporte de auditoría:

```typescript
const auditReport = await this.userRepository
  .createQueryBuilder('user')
  .select([
    'user.id',
    'user.username',
    'user.createdAt',
    'user.updatedAt',
    'user.deletedAt',
    'creator.username as createdByUsername',
    'updater.username as updatedByUsername',
    'deleter.username as deletedByUsername'
  ])
  .leftJoin('user', 'creator', 'creator.id = user.created_by')
  .leftJoin('user', 'updater', 'updater.id = user.updated_by')
  .leftJoin('user', 'deleter', 'deleter.id = user.deleted_by')
  .withDeleted()
  .getRawMany();
```

---

## 🌱 Seeders

Los seeders permiten poblar la base de datos con datos iniciales de forma automatizada y reproducible.

### **Ubicación**

- **Directorio**: [`src/database/seeds/`](../src/database/seeds/)
- **Runner**: [`src/database/seeds/run-seeders.ts`](../src/database/seeds/run-seeders.ts)

### **Seeders Disponibles**

1. **RoleSeeder** - Crea roles iniciales (admin, moderator, user)
2. **UserSeeder** - Crea usuarios de prueba con diferentes roles

### **Ejecutar Seeders**

```bash
npm run seed:run
```

### **Datos Generados**

El seeder crea los siguientes usuarios de prueba:

| Username   | Email                      | Password       | Rol       |
|------------|----------------------------|----------------|-----------|
| admin      | admin@socgerfleet.com      | Admin123!      | admin     |
| moderator  | moderator@socgerfleet.com  | Moderator123!  | moderator |
| testuser   | user@socgerfleet.com       | User123!       | user      |

### **Características**

- ✅ **Idempotentes** - Se pueden ejecutar múltiples veces sin duplicar datos
- 🔐 **Contraseñas hasheadas** - Usa bcrypt para seguridad
- 📊 **Feedback visual** - Muestra qué se creó o ya existía
- 🔄 **Reproducibles** - Mismos datos en cada ejecución

### **Crear un Nuevo Seeder**

1. **Crear archivo** en `src/database/seeds/`:

```typescript
// vehicle.seeder.ts
import { AppDataSource } from '../data-source';
import { Vehicle } from '../../entities/vehicle.entity';

export class VehicleSeeder {
  public async run(): Promise<void> {
    const vehicleRepository = AppDataSource.getRepository(Vehicle);

    const vehicles = [
      {
        plate: 'ABC123',
        model: 'Tesla Model 3',
        year: 2023,
      },
      // ... más vehículos
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

2. **Registrar en runner** [`run-seeders.ts`](../src/database/seeds/run-seeders.ts):

```typescript
import { VehicleSeeder } from './vehicle.seeder';

// Ejecutar nuevo seeder
console.log('🚗 Ejecutando Vehicle Seeder...');
const vehicleSeeder = new VehicleSeeder();
await vehicleSeeder.run();
```

### **Buenas Prácticas**

✅ **Hacer:**
- Verificar si el registro ya existe antes de crearlo
- Proporcionar feedback claro en consola
- Usar datos realistas y significativos
- Documentar las credenciales de usuarios de prueba
- Mantener seeders simples y enfocados

❌ **Evitar:**
- Crear seeders que no sean idempotentes
- Usar contraseñas simples en producción
- Incluir datos sensibles o reales
- Ejecutar seeders en producción sin revisión

---

## 🚀 Flujo de Trabajo Completo

### **Configuración Inicial**

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

3. Levantar base de datos:
   ```bash
   docker compose up -d
   ```

4. Ejecutar migraciones:
   ```bash
   npm run migration:run
   ```

5. Poblar datos iniciales:
   ```bash
   npm run seed:run
   ```

6. Iniciar aplicación:
   ```bash
   npm run start:dev
   ```

### **Desarrollo de Nueva Funcionalidad**

1. **Crear/Modificar entidades**
2. **Generar migración**:
   ```bash
   npm run migration:generate -- src/database/migrations/NombreFeature
   ```
3. **Revisar migración generada**
4. **Ejecutar migración**:
   ```bash
   npm run migration:run
   ```
5. **(Opcional) Crear seeder** si necesitas datos iniciales
6. **Probar funcionalidad**
7. **Commit** de código y migración juntos

### **Revertir Cambios**

Si algo sale mal:

```bash
# Revertir última migración
npm run migration:revert

# Ver estado actual
npm run migration:show
```

---

## 📊 Esquema de Base de Datos

### **Campos Agregados a Todas las Tablas**

```sql
-- Timestamps
created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
updated_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
deleted_at    DATETIME(6) NULL                                  -- Soft delete

-- Auditoría
created_by    INT NULL
updated_by    INT NULL
deleted_by    INT NULL
```

### **Índices Creados**

Para optimizar consultas con soft delete:

```sql
CREATE INDEX IDX_users_deleted_at ON users (deleted_at);
CREATE INDEX IDX_roles_deleted_at ON roles (deleted_at);
```

---

## 🔧 Troubleshooting

### **Error: Migrations are already loaded**

Reinicia la aplicación después de generar/ejecutar migraciones.

### **Error: Table already exists**

Tu base de datos ya tiene las tablas. Opciones:
1. Usar base de datos limpia
2. Modificar migración para verificar existencia
3. Ejecutar manualmente los cambios faltantes

### **Error: Cannot find module**

Asegúrate de que:
1. Compilaste el proyecto: `npm run build`
2. Las rutas en `data-source.ts` son correctas
3. Instalaste todas las dependencias

### **Seeders no crean datos**

Verifica:
1. Migraciones ejecutadas: `npm run migration:show`
2. Conexión a base de datos correcta
3. No hay errores en consola al ejecutar seeders

---

## 📚 Referencias

- [TypeORM Migrations](https://typeorm.io/migrations)
- [TypeORM Soft Delete](https://typeorm.io/delete-query-builder#soft-delete)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)

---

## ✅ Checklist de Implementación

- [x] BaseEntity con auditoría y soft delete
- [x] Migraciones TypeORM configuradas
- [x] Seeders para datos iniciales
- [x] Servicios actualizados para soft delete
- [x] Controladores con auditoría
- [x] Documentación completa
- [x] Scripts NPM configurados

---

<div align="center">
  <p>💡 <strong>Tip:</strong> Mantén este documento actualizado cuando agregues nuevas funcionalidades de base de datos</p>
</div>
