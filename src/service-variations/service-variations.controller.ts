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
} from '@nestjs/swagger';
import { Request } from 'express';
import { ServiceVariationsService } from './service-variations.service';
import { CreateServiceVariationDto } from './dto/create-service-variation.dto';
import { UpdateServiceVariationDto } from './dto/update-service-variation.dto';
import { ServiceVariationFiltersDto } from './dto/service-variation-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest extends Request {
  user: { userId: number };
}

@ApiTags('service-variations')
@Controller({ path: 'service-variations', version: '1' })
export class ServiceVariationsController {
  constructor(
    private readonly serviceVariationsService: ServiceVariationsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear variación de servicio',
    description: 'Crea una nueva variación de precio para una configuración de servicio. Requiere autenticación.',
  })
  @ApiResponse({
    status: 201,
    description: 'Variación creada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 404,
    description: 'Configuración de servicio no encontrada',
  })
  create(
    @Body(ValidationPipe) createServiceVariationDto: CreateServiceVariationDto,
    @Req() req: AuthRequest,
  ) {
    return this.serviceVariationsService.create(
      createServiceVariationDto,
      req.user.userId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Listar variaciones',
    description: 'Obtiene lista paginada con filtros: habilitadas, personalizadas, precio, etc.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida exitosamente' })
  findAll(@Query(ValidationPipe) filters: ServiceVariationFiltersDto) {
    return this.serviceVariationsService.findAll(filters);
  }

  @Get('service-config/:serviceConfigId')
  @ApiOperation({
    summary: 'Variaciones de una configuración',
    description: 'Obtiene todas las variaciones activas de una configuración de servicio.',
  })
  @ApiParam({
    name: 'serviceConfigId',
    description: 'ID de la configuración de servicio',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Variaciones encontradas' })
  findByServiceConfig(
    @Param('serviceConfigId', ParseIntPipe) serviceConfigId: number,
  ) {
    return this.serviceVariationsService.findByServiceConfig(serviceConfigId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener variación por ID',
    description: 'Obtiene una variación específica con relaciones.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la variación',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Variación encontrada' })
  @ApiResponse({ status: 404, description: 'Variación no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceVariationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar variación',
    description: 'Actualiza los datos de una variación de servicio. Requiere autenticación.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la variación',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Variación actualizada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Variación no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateServiceVariationDto: UpdateServiceVariationDto,
    @Req() req: AuthRequest,
  ) {
    return this.serviceVariationsService.update(
      id,
      updateServiceVariationDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar variación',
    description: 'Realiza soft delete de una variación de servicio. Requiere autenticación.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la variación',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Variación eliminada exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Variación no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.serviceVariationsService.remove(id, req.user.userId);
  }
}
