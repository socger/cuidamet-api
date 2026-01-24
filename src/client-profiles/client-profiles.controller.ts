import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientProfilesService } from './client-profiles.service';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { ClientProfileFiltersDto } from './dto/client-profile-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('client-profiles')
@Controller({ path: 'client-profiles', version: '1' })
export class ClientProfilesController {
  constructor(
    private readonly clientProfilesService: ClientProfilesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear nuevo perfil de cliente' })
  @ApiResponse({
    status: 201,
    description: 'Perfil de cliente creado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya tiene un perfil de cliente',
  })
  async create(
    @Body() createDto: CreateClientProfileDto,
    @Request() req,
  ) {
    const createdBy = req.user?.userId;
    return this.clientProfilesService.create(createDto, createdBy);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los perfiles de clientes con filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de perfiles obtenida exitosamente',
  })
  async findAll(@Query() filters: ClientProfileFiltersDto) {
    return this.clientProfilesService.findAll(filters);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Buscar perfiles cercanos a una ubicación' })
  @ApiQuery({ name: 'latitude', description: 'Latitud', example: 40.4168 })
  @ApiQuery({ name: 'longitude', description: 'Longitud', example: -3.7038 })
  @ApiQuery({
    name: 'radius',
    description: 'Radio en kilómetros',
    example: 10,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfiles cercanos encontrados',
  })
  async findNearby(
    @Query('latitude', ParseIntPipe) latitude: number,
    @Query('longitude', ParseIntPipe) longitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.clientProfilesService.findNearby(
      latitude,
      longitude,
      radius || 10,
    );
  }

  @Get('preference/:preference')
  @ApiOperation({ summary: 'Buscar perfiles por preferencia de categoría' })
  @ApiParam({
    name: 'preference',
    description: 'Categoría de preferencia',
    enum: ['Elderly Care', 'Child Care', 'Pet Care', 'Home Cleaning'],
  })
  @ApiResponse({
    status: 200,
    description: 'Perfiles encontrados',
  })
  async findByPreference(@Param('preference') preference: string) {
    return this.clientProfilesService.findByPreference(preference);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener perfil por ID de usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Perfil encontrado',
  })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.clientProfilesService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener perfil de cliente por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil de cliente',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil encontrado',
  })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientProfilesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar perfil de cliente' })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil de cliente',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateClientProfileDto,
    @Request() req,
  ) {
    const updatedBy = req.user?.userId;
    return this.clientProfilesService.update(id, updateDto, updatedBy);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar perfil de cliente (soft delete)' })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil de cliente',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Perfil eliminado exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const deletedBy = req.user?.userId;
    await this.clientProfilesService.remove(id, deletedBy);
  }
}
