import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceVariation } from '../entities/service-variation.entity';
import { ServiceConfig } from '../entities/service-config.entity';
import { CreateServiceVariationDto } from './dto/create-service-variation.dto';
import { UpdateServiceVariationDto } from './dto/update-service-variation.dto';
import { ServiceVariationFiltersDto } from './dto/service-variation-filters.dto';

@Injectable()
export class ServiceVariationsService {
  constructor(
    @InjectRepository(ServiceVariation)
    private readonly serviceVariationRepository: Repository<ServiceVariation>,
    @InjectRepository(ServiceConfig)
    private readonly serviceConfigRepository: Repository<ServiceConfig>,
  ) {}

  /**
   * Crear nueva variación de servicio
   */
  async create(
    createServiceVariationDto: CreateServiceVariationDto,
    createdBy: number,
  ) {
    // Validar que el service config exista
    const serviceConfig = await this.serviceConfigRepository.findOne({
      where: { id: createServiceVariationDto.serviceConfigId },
    });

    if (!serviceConfig) {
      throw new NotFoundException(
        `Configuración de servicio con ID ${createServiceVariationDto.serviceConfigId} no encontrada`,
      );
    }

    // Crear variación con auditoría
    const variation = this.serviceVariationRepository.create({
      ...createServiceVariationDto,
      createdBy,
    });

    const savedVariation = await this.serviceVariationRepository.save(variation);

    return {
      message: 'Variación de servicio creada exitosamente',
      data: savedVariation,
    };
  }

  /**
   * Listar variaciones con filtros
   */
  async findAll(filters: ServiceVariationFiltersDto) {
    const {
      search,
      serviceConfigId,
      enabled,
      isCustom,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'displayOrder',
      sortOrder = 'ASC',
    } = filters;

    const queryBuilder =
      this.serviceVariationRepository.createQueryBuilder('variation');

    // Búsqueda general
    if (search) {
      queryBuilder.andWhere(
        '(variation.name LIKE :search OR variation.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filtros específicos
    if (serviceConfigId) {
      queryBuilder.andWhere('variation.serviceConfigId = :serviceConfigId', {
        serviceConfigId,
      });
    }

    if (typeof enabled === 'boolean') {
      queryBuilder.andWhere('variation.enabled = :enabled', {
        enabled: enabled ? 1 : 0,
      });
    }

    if (typeof isCustom === 'boolean') {
      queryBuilder.andWhere('variation.isCustom = :isCustom', {
        isCustom: isCustom ? 1 : 0,
      });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('variation.price <= :maxPrice', { maxPrice });
    }

    // Ordenamiento
    const orderField = `variation.${sortBy}`;
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
   * Obtener variación por ID
   */
  async findOne(id: number) {
    const variation = await this.serviceVariationRepository.findOne({
      where: { id },
      relations: ['serviceConfig'],
    });

    if (!variation) {
      throw new NotFoundException(
        `Variación de servicio con ID ${id} no encontrada`,
      );
    }

    return {
      message: 'Variación de servicio encontrada',
      data: variation,
    };
  }

  /**
   * Obtener variaciones de una configuración de servicio
   */
  async findByServiceConfig(serviceConfigId: number) {
    const variations = await this.serviceVariationRepository.find({
      where: { serviceConfigId, enabled: true },
      order: { displayOrder: 'ASC' },
    });

    return {
      message: `${variations.length} variaciones encontradas`,
      data: variations,
      meta: {
        serviceConfigId,
        total: variations.length,
      },
    };
  }

  /**
   * Actualizar variación
   */
  async update(
    id: number,
    updateServiceVariationDto: UpdateServiceVariationDto,
    updatedBy: number,
  ) {
    const variation = await this.serviceVariationRepository.findOne({
      where: { id },
    });

    if (!variation) {
      throw new NotFoundException(
        `Variación de servicio con ID ${id} no encontrada`,
      );
    }

    // Prevenir cambio de serviceConfigId
    if (
      updateServiceVariationDto.serviceConfigId &&
      updateServiceVariationDto.serviceConfigId !== variation.serviceConfigId
    ) {
      throw new BadRequestException(
        'No se puede cambiar la configuración de servicio asociada',
      );
    }

    // Actualizar con auditoría
    Object.assign(variation, updateServiceVariationDto, { updatedBy });

    const updatedVariation =
      await this.serviceVariationRepository.save(variation);

    return {
      message: 'Variación de servicio actualizada exitosamente',
      data: updatedVariation,
    };
  }

  /**
   * Eliminar variación (soft delete)
   */
  async remove(id: number, deletedBy: number) {
    const variation = await this.serviceVariationRepository.findOne({
      where: { id },
    });

    if (!variation) {
      throw new NotFoundException(
        `Variación de servicio con ID ${id} no encontrada`,
      );
    }

    // Soft delete con auditoría
    variation.deletedBy = deletedBy;
    await this.serviceVariationRepository.save(variation);
    await this.serviceVariationRepository.softDelete(id);

    return {
      message: 'Variación de servicio eliminada exitosamente',
      data: variation,
    };
  }
}
