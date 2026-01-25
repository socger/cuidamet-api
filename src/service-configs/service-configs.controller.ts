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
  Req,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ServiceConfigsService } from './service-configs.service';
import { CreateServiceConfigDto } from './dto/create-service-config.dto';
import { UpdateServiceConfigDto } from './dto/update-service-config.dto';
import { ServiceConfigFiltersDto } from './dto/service-config-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest extends Request {
  user: { userId: number };
}

@ApiTags('service-configs')
@Controller({ path: 'service-configs', version: '1' })
export class ServiceConfigsController {
  constructor(private readonly serviceConfigsService: ServiceConfigsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear configuración de servicio',
    description: 'Crea una nueva configuración de servicio para un proveedor. Requiere autenticación.',
  })
  @ApiResponse({
    status: 201,
    description: 'Configuración creada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  create(
    @Body(ValidationPipe) createServiceConfigDto: CreateServiceConfigDto,
    @Req() req: AuthRequest,
  ) {
    return this.serviceConfigsService.create(
      createServiceConfigDto,
      req.user.userId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Listar configuraciones de servicios',
    description: 'Obtiene lista paginada con filtros: categoría, tarifa, habilidades, etc.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida exitosamente' })
  findAll(@Query(ValidationPipe) filters: ServiceConfigFiltersDto) {
    return this.serviceConfigsService.findAll(filters);
  }

  @Get('provider/:providerId')
  @ApiOperation({
    summary: 'Servicios de un proveedor',
    description: 'Obtiene todas las configuraciones de servicio de un proveedor.',
  })
  @ApiParam({
    name: 'providerId',
    description: 'ID del proveedor',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Configuraciones encontradas' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  findByProvider(@Param('providerId', ParseIntPipe) providerId: number) {
    return this.serviceConfigsService.findByProvider(providerId);
  }

  @Get('category/:careCategory')
  @ApiOperation({
    summary: 'Servicios por categoría',
    description: 'Obtiene servicios de una categoría específica.',
  })
  @ApiParam({
    name: 'careCategory',
    description: 'Categoría de cuidado',
    enum: ['Elderly Care', 'Child Care', 'Pet Care', 'Home Cleaning'],
    example: 'Elderly Care',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número de resultados (por defecto: 20)',
    example: 20,
  })
  @ApiResponse({ status: 200, description: 'Servicios encontrados' })
  findByCategory(
    @Param('careCategory') careCategory: string,
    @Query('limit') limit: number = 20,
  ) {
    return this.serviceConfigsService.findByCategory(careCategory, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener configuración por ID',
    description: 'Obtiene una configuración de servicio específica con relaciones.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la configuración',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Configuración encontrada' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceConfigsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar configuración',
    description: 'Actualiza los datos de una configuración de servicio. Requiere autenticación.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la configuración',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Configuración actualizada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateServiceConfigDto: UpdateServiceConfigDto,
    @Req() req: AuthRequest,
  ) {
    return this.serviceConfigsService.update(
      id,
      updateServiceConfigDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar configuración',
    description: 'Realiza soft delete de una configuración de servicio. Requiere autenticación.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la configuración',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Configuración eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.serviceConfigsService.remove(id, req.user.userId);
  }
}
