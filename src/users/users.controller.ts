import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserFiltersDto } from './dto/user-filters.dto';
import { UserProfilesResponseDto } from './dto/user-profiles-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller({ path: 'users', version: '1' })
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios con filtros',
    description:
      'Obtiene una lista paginada de usuarios con opciones de búsqueda y filtrado avanzadas. ' +
      'Soporta filtros por múltiples campos, ordenación personalizada y paginación.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Búsqueda en username, email, firstName y lastName',
  })
  @ApiQuery({
    name: 'username',
    required: false,
    type: String,
    description: 'Filtrar por username',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filtrar por email',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado activo',
  })
  @ApiQuery({
    name: 'roleName',
    required: false,
    type: String,
    description: 'Filtrar por nombre de rol',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'username', 'email', 'firstName', 'lastName'],
    description: 'Campo para ordenar',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Orden de los resultados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    schema: {
      example: {
        message: 'Lista de usuarios obtenida exitosamente',
        data: [
          {
            id: 1,
            username: 'admin',
            email: 'admin@socgerfleet.com',
            firstName: 'Admin',
            lastName: 'User',
            isActive: true,
            roles: ['admin'],
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      },
    },
  })
  async findAll(@Query() query: any) {
    // Manejar paginación
    const paginationDto = new PaginationDto();
    paginationDto.page = query.page ? parseInt(query.page, 10) : 1;
    paginationDto.limit = query.limit ? parseInt(query.limit, 10) : 10;

    // Validar límites
    if (paginationDto.page < 1) paginationDto.page = 1;
    if (paginationDto.limit < 1) paginationDto.limit = 10;
    if (paginationDto.limit > 100) paginationDto.limit = 100;

    // Crear filtros DTO
    const filtersDto = new UserFiltersDto();
    if (query.search) filtersDto.search = query.search;
    if (query.username) filtersDto.username = query.username;
    if (query.email) filtersDto.email = query.email;
    if (query.firstName) filtersDto.firstName = query.firstName;
    if (query.lastName) filtersDto.lastName = query.lastName;
    if (query.isActive !== undefined)
      filtersDto.isActive = query.isActive === 'true';
    if (query.roleName) filtersDto.roleName = query.roleName;
    if (query.roleId) filtersDto.roleId = parseInt(query.roleId, 10);
    if (query.createdFrom) filtersDto.createdFrom = query.createdFrom;
    if (query.createdTo) filtersDto.createdTo = query.createdTo;
    if (query.sortBy) filtersDto.sortBy = query.sortBy;
    if (query.sortOrder) filtersDto.sortOrder = query.sortOrder;

    const result = await this.usersService.findAll(paginationDto, filtersDto);

    return {
      message: 'Lista de usuarios obtenida exitosamente',
      ...result,
      filters: filtersDto, // Incluir filtros aplicados en la respuesta
    };
  }

  @Get('search')
  @ApiOperation({
    summary: 'Búsqueda rápida de usuarios',
    description:
      'Búsqueda simplificada en username, email, firstName y lastName.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Término de búsqueda',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite de resultados (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Búsqueda completada',
  })
  async search(
    @Query('q') searchTerm: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const results = await this.usersService.search(searchTerm, limit);

    return {
      message: 'Búsqueda completada exitosamente',
      data: results,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description: 'Obtiene la información detallada de un usuario específico.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario obtenido exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Usuario obtenido exitosamente',
      data: await this.usersService.findOne(id),
    };
  }

  @Get(':id/profiles')
  @ApiOperation({
    summary: 'Obtener perfiles del usuario',
    description:
      'Obtiene los perfiles de cliente y/o proveedor asociados a un usuario. ' +
      'Un usuario puede tener perfil de cliente, proveedor, ambos o ninguno.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del usuario',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfiles obtenidos exitosamente',
    type: UserProfilesResponseDto,
    schema: {
      example: {
        message: 'Perfiles obtenidos exitosamente',
        data: {
          clientProfile: {
            id: 1,
            userId: 1,
            address: 'Calle Ejemplo 123',
            city: 'Madrid',
            postalCode: '28001',
            phoneNumber: '+34600000000',
            emergencyContactName: 'Juan Pérez',
            emergencyContactPhone: '+34600000001',
            preferredLanguage: 'es',
            notifications: true,
            createdAt: '2026-01-25T10:00:00.000Z',
            updatedAt: '2026-01-25T10:00:00.000Z',
          },
          providerProfile: null,
          hasProfiles: true,
          profileType: 'client',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async getUserProfiles(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Perfiles obtenidos exitosamente',
      data: await this.usersService.getUserProfiles(id),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nuevo usuario',
    description:
      'Crea un nuevo usuario en el sistema. El email y username deben ser únicos.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Email o username ya registrado',
  })
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @Request() req,
  ) {
    const createdBy = req.user?.userId;
    return {
      message: 'Usuario creado exitosamente',
      data: await this.usersService.create(createUserDto, createdBy),
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar usuario',
    description: 'Actualiza la información de un usuario existente.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    const updatedBy = req.user?.userId;
    return {
      message: 'Usuario actualizado exitosamente',
      data: await this.usersService.update(id, updateUserDto, updatedBy),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar usuario (soft delete)',
    description:
      'Elimina un usuario del sistema de forma lógica (soft delete). El usuario se mantiene en la base de datos pero marcado como eliminado.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  @ApiResponse({
    status: 204,
    description: 'Usuario eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const deletedBy = req.user?.userId;
    await this.usersService.remove(id, deletedBy);
    return {
      message: 'Usuario eliminado exitosamente',
    };
  }

  @Post(':userId/roles/:roleId')
  @ApiOperation({
    summary: 'Asignar rol a usuario',
    description: 'Asigna un rol específico a un usuario.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'ID del usuario' })
  @ApiParam({ name: 'roleId', type: Number, description: 'ID del rol' })
  @ApiResponse({
    status: 200,
    description: 'Rol asignado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario o rol no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'El usuario ya tiene este rol',
  })
  async assignRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return {
      message: 'Rol asignado exitosamente',
      data: await this.usersService.assignRole(userId, roleId),
    };
  }

  @Patch(':userId/active-role')
  @ApiOperation({
    summary: 'Cambiar el rol activo del usuario',
    description:
      'Cambia el rol activo del usuario entre cliente y proveedor. ' +
      'Si el usuario no tiene el rol asignado, se asigna automáticamente. ' +
      'Devuelve el perfil correspondiente si existe.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Rol activo cambiado exitosamente',
    schema: {
      example: {
        message: 'Rol activo actualizado exitosamente',
        data: {
          activeRole: 'provider',
          profile: {
            id: 1,
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan@example.com',
            // ... otros campos del perfil
          },
          profileType: 'provider',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario o rol no encontrado',
  })
  async switchActiveRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { roleName: 'client' | 'provider' },
  ) {
    return {
      message: 'Rol activo actualizado exitosamente',
      data: await this.usersService.switchActiveRole(userId, body.roleName),
    };
  }

  @Delete(':userId/roles/:roleId')
  @ApiOperation({
    summary: 'Remover rol de usuario',
    description: 'Remueve un rol específico de un usuario.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'ID del usuario' })
  @ApiParam({ name: 'roleId', type: Number, description: 'ID del rol' })
  @ApiResponse({
    status: 200,
    description: 'Rol removido exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario o rol no encontrado',
  })
  async removeRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return {
      message: 'Rol removido exitosamente',
      data: await this.usersService.removeRole(userId, roleId),
    };
  }
}
