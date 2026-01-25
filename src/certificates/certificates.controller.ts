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
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CertificateFiltersDto } from './dto/certificate-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest extends Request {
  user: { userId: number };
}

@ApiTags('certificates')
@Controller({ path: 'certificates', version: '1' })
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear certificado',
    description: 'Crea un nuevo certificado asociado a una configuración de servicio. Requiere autenticación.',
  })
  @ApiResponse({ status: 201, description: 'Certificado creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 404,
    description: 'Configuración de servicio no encontrada',
  })
  create(
    @Body(ValidationPipe) createCertificateDto: CreateCertificateDto,
    @Req() req: AuthRequest,
  ) {
    return this.certificatesService.create(
      createCertificateDto,
      req.user.userId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Listar certificados',
    description: 'Obtiene lista paginada con filtros: tipo, estado, configuración, etc.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida exitosamente' })
  findAll(@Query(ValidationPipe) filters: CertificateFiltersDto) {
    return this.certificatesService.findAll(filters);
  }

  @Get('service-config/:serviceConfigId')
  @ApiOperation({
    summary: 'Certificados de una configuración',
    description: 'Obtiene todos los certificados de una configuración de servicio.',
  })
  @ApiParam({
    name: 'serviceConfigId',
    description: 'ID de la configuración de servicio',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Certificados encontrados' })
  findByServiceConfig(
    @Param('serviceConfigId', ParseIntPipe) serviceConfigId: number,
  ) {
    return this.certificatesService.findByServiceConfig(serviceConfigId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener certificado por ID',
    description: 'Obtiene un certificado específico con relaciones.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del certificado',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Certificado encontrado' })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.certificatesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar certificado',
    description: 'Actualiza los datos de un certificado. Requiere autenticación.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del certificado',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Certificado actualizado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateCertificateDto: UpdateCertificateDto,
    @Req() req: AuthRequest,
  ) {
    return this.certificatesService.update(
      id,
      updateCertificateDto,
      req.user.userId,
    );
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Verificar certificado',
    description: 'Marca un certificado como verificado. Requiere autenticación.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del certificado',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Certificado verificado exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  verify(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.certificatesService.verify(id, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar certificado',
    description: 'Realiza soft delete de un certificado. Requiere autenticación.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del certificado',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Certificado eliminado exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.certificatesService.remove(id, req.user.userId);
  }
}
