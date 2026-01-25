import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from '../entities/certificate.entity';
import { ServiceConfig } from '../entities/service-config.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CertificateFiltersDto } from './dto/certificate-filters.dto';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(ServiceConfig)
    private readonly serviceConfigRepository: Repository<ServiceConfig>,
  ) {}

  /**
   * Crear nuevo certificado
   */
  async create(createCertificateDto: CreateCertificateDto, createdBy: number) {
    // Validar que el service config exista
    const serviceConfig = await this.serviceConfigRepository.findOne({
      where: { id: createCertificateDto.serviceConfigId },
    });

    if (!serviceConfig) {
      throw new NotFoundException(
        `Configuración de servicio con ID ${createCertificateDto.serviceConfigId} no encontrada`,
      );
    }

    // Crear certificado con auditoría
    const certificate = this.certificateRepository.create({
      ...createCertificateDto,
      createdBy,
    });

    const savedCertificate = await this.certificateRepository.save(certificate);

    return {
      message: 'Certificado creado exitosamente',
      data: savedCertificate,
    };
  }

  /**
   * Listar certificados con filtros
   */
  async findAll(filters: CertificateFiltersDto) {
    const {
      search,
      serviceConfigId,
      certificateType,
      verificationStatus,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder =
      this.certificateRepository.createQueryBuilder('certificate');

    // Búsqueda general
    if (search) {
      queryBuilder.andWhere(
        '(certificate.name LIKE :search OR ' +
          'certificate.description LIKE :search OR ' +
          'certificate.contactInfo LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filtros específicos
    if (serviceConfigId) {
      queryBuilder.andWhere('certificate.serviceConfigId = :serviceConfigId', {
        serviceConfigId,
      });
    }

    if (certificateType) {
      queryBuilder.andWhere('certificate.certificateType = :certificateType', {
        certificateType,
      });
    }

    if (verificationStatus) {
      queryBuilder.andWhere(
        'certificate.verificationStatus = :verificationStatus',
        { verificationStatus },
      );
    }

    // Ordenamiento
    const orderField = `certificate.${sortBy}`;
    queryBuilder.orderBy(orderField, sortOrder);

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Ejecutar query
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener certificado por ID
   */
  async findOne(id: number) {
    const certificate = await this.certificateRepository.findOne({
      where: { id },
      relations: ['serviceConfig'],
    });

    if (!certificate) {
      throw new NotFoundException(`Certificado con ID ${id} no encontrado`);
    }

    return {
      message: 'Certificado encontrado',
      data: certificate,
    };
  }

  /**
   * Obtener certificados de una configuración de servicio
   */
  async findByServiceConfig(serviceConfigId: number) {
    const certificates = await this.certificateRepository.find({
      where: { serviceConfigId },
      order: { createdAt: 'DESC' },
    });

    return {
      message: `${certificates.length} certificados encontrados`,
      data: certificates,
      meta: {
        serviceConfigId,
        total: certificates.length,
      },
    };
  }

  /**
   * Actualizar certificado
   */
  async update(
    id: number,
    updateCertificateDto: UpdateCertificateDto,
    updatedBy: number,
  ) {
    const certificate = await this.certificateRepository.findOne({
      where: { id },
    });

    if (!certificate) {
      throw new NotFoundException(`Certificado con ID ${id} no encontrado`);
    }

    // Prevenir cambio de serviceConfigId
    if (
      updateCertificateDto.serviceConfigId &&
      updateCertificateDto.serviceConfigId !== certificate.serviceConfigId
    ) {
      throw new BadRequestException(
        'No se puede cambiar la configuración de servicio asociada',
      );
    }

    // Actualizar con auditoría
    Object.assign(certificate, updateCertificateDto, { updatedBy });

    const updatedCertificate =
      await this.certificateRepository.save(certificate);

    return {
      message: 'Certificado actualizado exitosamente',
      data: updatedCertificate,
    };
  }

  /**
   * Verificar certificado (cambiar estado a verified)
   */
  async verify(id: number, verifiedBy: number) {
    const certificate = await this.certificateRepository.findOne({
      where: { id },
    });

    if (!certificate) {
      throw new NotFoundException(`Certificado con ID ${id} no encontrado`);
    }

    certificate.verificationStatus = 'verified';
    certificate.verifiedAt = new Date();
    certificate.verifiedBy = verifiedBy;
    certificate.updatedBy = verifiedBy;

    const verifiedCertificate =
      await this.certificateRepository.save(certificate);

    return {
      message: 'Certificado verificado exitosamente',
      data: verifiedCertificate,
    };
  }

  /**
   * Eliminar certificado (soft delete)
   */
  async remove(id: number, deletedBy: number) {
    const certificate = await this.certificateRepository.findOne({
      where: { id },
    });

    if (!certificate) {
      throw new NotFoundException(`Certificado con ID ${id} no encontrado`);
    }

    // Soft delete con auditoría
    certificate.deletedBy = deletedBy;
    await this.certificateRepository.save(certificate);
    await this.certificateRepository.softDelete(id);

    return {
      message: 'Certificado eliminado exitosamente',
      data: certificate,
    };
  }
}
