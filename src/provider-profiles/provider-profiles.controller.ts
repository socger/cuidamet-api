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
import { ProviderProfilesService } from './provider-profiles.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { ProviderProfileFiltersDto } from './dto/provider-profile-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest extends Request {
  user: { userId: number };
}

@ApiTags('provider-profiles')
@Controller({ path: 'provider-profiles', version: '1' })
export class ProviderProfilesController {
  constructor(
    private readonly providerProfilesService: ProviderProfilesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear perfil de proveedor',
    description: 'Crea un nuevo perfil de proveedor asociado a un usuario. Requiere autenticación.',
  })
  @ApiResponse({
    status: 201,
    description: 'Perfil de proveedor creado exitosamente',
    schema: {
      example: {
        message: 'Perfil de proveedor creado exitosamente',
        data: {
          id: 1,
          userId: 2,
          name: 'Ana García Martínez',
          location: 'Madrid, España',
          profileStatus: 'draft',
          isPremium: false,
          rating: 0,
          reviewsCount: 0,
          completedBookings: 0,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya tiene un perfil de proveedor',
  })
  create(
    @Body(ValidationPipe) createProviderProfileDto: CreateProviderProfileDto,
    @Req() req: AuthRequest,
  ) {
    return this.providerProfilesService.create(
      createProviderProfileDto,
      req.user.userId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Listar perfiles de proveedores',
    description:
      'Obtiene una lista paginada de perfiles de proveedores con filtros avanzados: ' +
      'búsqueda general, ubicación, idiomas, calificación, disponibilidad, estado, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de perfiles de proveedores obtenida exitosamente',
    schema: {
      example: {
        data: [
          {
            id: 1,
            userId: 2,
            name: 'Ana García Martínez',
            location: 'Madrid, España',
            rating: 4.8,
            reviewsCount: 42,
            completedBookings: 127,
            profileStatus: 'published',
            isPremium: true,
          },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
        },
      },
    },
  })
  findAll(@Query(ValidationPipe) filters: ProviderProfileFiltersDto) {
    return this.providerProfilesService.findAll(filters);
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Buscar proveedores cercanos',
    description:
      'Encuentra proveedores cerca de una ubicación específica usando coordenadas geográficas. ' +
      'Usa la fórmula Haversine para calcular distancias.',
  })
  @ApiQuery({
    name: 'latitude',
    required: true,
    description: 'Latitud de la ubicación',
    example: 40.4168,
  })
  @ApiQuery({
    name: 'longitude',
    required: true,
    description: 'Longitud de la ubicación',
    example: -3.7038,
  })
  @ApiQuery({
    name: 'radiusKm',
    required: false,
    description: 'Radio de búsqueda en kilómetros (por defecto: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Proveedores cercanos encontrados',
    schema: {
      example: {
        message: '5 proveedores encontrados en un radio de 10 km',
        data: [
          {
            id: 1,
            name: 'Ana García',
            location: 'Madrid, España',
            distance: 2.5,
            rating: 4.8,
          },
        ],
        meta: {
          latitude: 40.4168,
          longitude: -3.7038,
          radiusKm: 10,
          total: 5,
        },
      },
    },
  })
  findNearby(
    @Query('latitude', ParseIntPipe) latitude: number,
    @Query('longitude', ParseIntPipe) longitude: number,
    @Query('radiusKm') radiusKm: number = 10,
  ) {
    return this.providerProfilesService.findNearby(latitude, longitude, radiusKm);
  }

  @Get('top-rated')
  @ApiOperation({
    summary: 'Proveedores mejor valorados',
    description: 'Obtiene los proveedores con mejor calificación.',
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    description: 'Calificación mínima (por defecto: 4.5)',
    example: 4.5,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número de resultados (por defecto: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Proveedores mejor valorados encontrados',
    schema: {
      example: {
        message: '10 proveedores mejor valorados encontrados',
        data: [
          {
            id: 1,
            name: 'Ana García',
            rating: 4.9,
            reviewsCount: 150,
            completedBookings: 250,
          },
        ],
        meta: {
          minRating: 4.5,
          total: 10,
        },
      },
    },
  })
  findTopRated(
    @Query('minRating') minRating: number = 4.5,
    @Query('limit') limit: number = 10,
  ) {
    return this.providerProfilesService.findTopRated(minRating, limit);
  }

  @Get('premium')
  @ApiOperation({
    summary: 'Proveedores premium',
    description: 'Obtiene los proveedores con suscripción premium.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número de resultados (por defecto: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Proveedores premium encontrados',
    schema: {
      example: {
        message: '10 proveedores premium encontrados',
        data: [
          {
            id: 1,
            name: 'Ana García',
            isPremium: true,
            rating: 4.8,
            completedBookings: 200,
          },
        ],
        meta: {
          total: 10,
        },
      },
    },
  })
  findPremium(@Query('limit') limit: number = 10) {
    return this.providerProfilesService.findPremium(limit);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Obtener perfil de proveedor por userId',
    description: 'Obtiene el perfil de proveedor asociado a un usuario específico.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID del usuario',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil de proveedor encontrado',
    schema: {
      example: {
        message: 'Perfil de proveedor encontrado',
        data: {
          id: 1,
          userId: 2,
          name: 'Ana García Martínez',
          location: 'Madrid, España',
          rating: 4.8,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.providerProfilesService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener perfil de proveedor por ID',
    description: 'Obtiene un perfil de proveedor específico por su ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil de proveedor',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil de proveedor encontrado',
    schema: {
      example: {
        message: 'Perfil de proveedor encontrado',
        data: {
          id: 1,
          userId: 2,
          name: 'Ana García Martínez',
          location: 'Madrid, España',
          rating: 4.8,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.providerProfilesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar perfil de proveedor',
    description: 'Actualiza los datos de un perfil de proveedor. Requiere autenticación.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil de proveedor',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil de proveedor actualizado exitosamente',
    schema: {
      example: {
        message: 'Perfil de proveedor actualizado exitosamente',
        data: {
          id: 1,
          name: 'Ana García López',
          location: 'Barcelona, España',
          rating: 4.9,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o intento de cambiar userId' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateProviderProfileDto: UpdateProviderProfileDto,
    @Req() req: AuthRequest,
  ) {
    return this.providerProfilesService.update(
      id,
      updateProviderProfileDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar perfil de proveedor',
    description:
      'Realiza un soft delete del perfil de proveedor. Requiere autenticación.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil de proveedor',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil de proveedor eliminado exitosamente',
    schema: {
      example: {
        message: 'Perfil de proveedor eliminado exitosamente',
        data: {
          id: 1,
          name: 'Ana García Martínez',
          deletedAt: '2026-01-25T10:30:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.providerProfilesService.remove(id, req.user.userId);
  }
}
