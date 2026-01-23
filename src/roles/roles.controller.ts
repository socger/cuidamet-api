import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RoleFiltersDto } from './dto/role-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('roles')
@Controller({ path: 'roles', version: '1' })
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar roles con filtros',
    description:
      'Obtiene una lista paginada de roles con opciones de búsqueda y filtrado. ' +
      'Incluye información del conteo de usuarios por rol.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Búsqueda en nombre y descripción',
  })
  @ApiQuery({
    name: 'minUsers',
    required: false,
    type: Number,
    description: 'Filtrar roles con mínimo número de usuarios',
  })
  @ApiQuery({
    name: 'maxUsers',
    required: false,
    type: Number,
    description: 'Filtrar roles con máximo número de usuarios',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'createdAt', 'userCount'],
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
    description: 'Lista de roles obtenida exitosamente',
    schema: {
      example: {
        message: 'Lista de roles obtenida exitosamente',
        data: [
          {
            id: 1,
            name: 'admin',
            description: 'Administrator role',
            userCount: 5,
            createdAt: '2024-01-01T00:00:00.000Z',
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
    const filtersDto = new RoleFiltersDto();
    if (query.search) filtersDto.search = query.search;
    if (query.name) filtersDto.name = query.name;
    if (query.description) filtersDto.description = query.description;
    if (query.createdFrom) filtersDto.createdFrom = query.createdFrom;
    if (query.createdTo) filtersDto.createdTo = query.createdTo;
    if (query.minUsers !== undefined)
      filtersDto.minUsers = parseInt(query.minUsers, 10);
    if (query.maxUsers !== undefined)
      filtersDto.maxUsers = parseInt(query.maxUsers, 10);
    if (query.sortBy) filtersDto.sortBy = query.sortBy;
    if (query.sortOrder) filtersDto.sortOrder = query.sortOrder;

    const result = await this.rolesService.findAll(paginationDto, filtersDto);

    return {
      message: 'Lista de roles obtenida exitosamente',
      ...result,
      filters: filtersDto, // Incluir filtros aplicados en la respuesta
    };
  }

  @Get('search')
  @ApiOperation({
    summary: 'Búsqueda rápida de roles',
    description: 'Búsqueda simplificada en nombre y descripción de roles.',
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
    // Aplicar límites como en findAll
    const validLimit = Math.max(1, Math.min(100, limit));

    const results = await this.rolesService.search(searchTerm, validLimit);
    return {
      message: 'Búsqueda completada exitosamente',
      data: results,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener rol por ID',
    description:
      'Obtiene la información detallada de un rol específico, incluyendo usuarios asociados.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del rol' })
  @ApiResponse({
    status: 200,
    description: 'Rol obtenido exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Rol obtenido exitosamente',
      data: await this.rolesService.findOne(id),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nuevo rol',
    description:
      'Crea un nuevo rol en el sistema. El nombre del rol debe ser único.',
  })
  @ApiResponse({
    status: 201,
    description: 'Rol creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Nombre de rol ya existe',
  })
  async create(
    @Body(ValidationPipe) createRoleDto: CreateRoleDto,
    @Request() req,
  ) {
    const createdBy = req.user?.userId;
    return {
      message: 'Rol creado exitosamente',
      data: await this.rolesService.create(createRoleDto, createdBy),
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar rol',
    description: 'Actualiza la información de un rol existente.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del rol' })
  @ApiResponse({
    status: 200,
    description: 'Rol actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateRoleDto: UpdateRoleDto,
    @Request() req,
  ) {
    const updatedBy = req.user?.userId;
    return {
      message: 'Rol actualizado exitosamente',
      data: await this.rolesService.update(id, updateRoleDto, updatedBy),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar rol (soft delete)',
    description:
      'Elimina un rol del sistema de forma lógica (soft delete). El rol se mantiene en la base de datos pero marcado como eliminado.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del rol' })
  @ApiResponse({
    status: 204,
    description: 'Rol eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar un rol con usuarios asignados',
  })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const deletedBy = req.user?.userId;
    await this.rolesService.remove(id, deletedBy);
    return {
      message: 'Rol eliminado exitosamente',
    };
  }
}
