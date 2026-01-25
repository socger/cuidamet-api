import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceConfig } from '../entities/service-config.entity';
import { ProviderProfile } from '../entities/provider-profile.entity';
import { CreateServiceConfigDto } from './dto/create-service-config.dto';
import { UpdateServiceConfigDto } from './dto/update-service-config.dto';
import { ServiceConfigFiltersDto } from './dto/service-config-filters.dto';

@Injectable()
export class ServiceConfigsService {
  constructor(
    @InjectRepository(ServiceConfig)
    private readonly serviceConfigRepository: Repository<ServiceConfig>,
    @InjectRepository(ProviderProfile)
    private readonly providerProfileRepository: Repository<ProviderProfile>,
  ) {}

  /**
   * Crear nueva configuración de servicio
   */
  async create(
    createServiceConfigDto: CreateServiceConfigDto,
    createdBy: number,
  ) {
    // Validar que el proveedor exista
    const provider = await this.providerProfileRepository.findOne({
      where: { id: createServiceConfigDto.providerId },
    });

    if (!provider) {
      throw new NotFoundException(
        `Proveedor con ID ${createServiceConfigDto.providerId} no encontrado`,
      );
    }

    // Crear configuración con auditoría
    const serviceConfig = this.serviceConfigRepository.create({
      ...createServiceConfigDto,
      createdBy,
    });

    const savedConfig = await this.serviceConfigRepository.save(serviceConfig);

    return {
      message: 'Configuración de servicio creada exitosamente',
      data: savedConfig,
    };
  }

  /**
   * Listar configuraciones con filtros y paginación
   */
  async findAll(filters: ServiceConfigFiltersDto) {
    const {
      search,
      providerId,
      careCategory,
      completed,
      maxHourlyRate,
      medicalSkill,
      acceptedPet,
      ecoFriendly,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder =
      this.serviceConfigRepository.createQueryBuilder('config');

    // Búsqueda general
    if (search) {
      queryBuilder.andWhere(
        '(config.description LIKE :search OR ' +
          'config.tasks LIKE :search OR ' +
          'config.training LIKE :search OR ' +
          'config.medicalSkills LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filtros específicos
    if (providerId) {
      queryBuilder.andWhere('config.providerId = :providerId', { providerId });
    }

    if (careCategory) {
      queryBuilder.andWhere('config.careCategory = :careCategory', {
        careCategory,
      });
    }

    if (typeof completed === 'boolean') {
      queryBuilder.andWhere('config.completed = :completed', {
        completed: completed ? 1 : 0,
      });
    }

    if (maxHourlyRate !== undefined) {
      queryBuilder.andWhere('config.hourlyRate <= :maxHourlyRate', {
        maxHourlyRate,
      });
    }

    if (medicalSkill) {
      queryBuilder.andWhere('config.medicalSkills LIKE :medicalSkill', {
        medicalSkill: `%${medicalSkill}%`,
      });
    }

    if (acceptedPet) {
      queryBuilder.andWhere('config.acceptedPets LIKE :acceptedPet', {
        acceptedPet: `%${acceptedPet}%`,
      });
    }

    if (typeof ecoFriendly === 'boolean') {
      queryBuilder.andWhere('config.ecoFriendly = :ecoFriendly', {
        ecoFriendly: ecoFriendly ? 1 : 0,
      });
    }

    // Ordenamiento
    const orderField = `config.${sortBy}`;
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
   * Obtener configuración por ID con relaciones
   */
  async findOne(id: number) {
    const config = await this.serviceConfigRepository.findOne({
      where: { id },
      relations: ['provider', 'certificates', 'variations'],
    });

    if (!config) {
      throw new NotFoundException(
        `Configuración de servicio con ID ${id} no encontrada`,
      );
    }

    return {
      message: 'Configuración de servicio encontrada',
      data: config,
    };
  }

  /**
   * Obtener configuraciones de un proveedor
   */
  async findByProvider(providerId: number) {
    const configs = await this.serviceConfigRepository.find({
      where: { providerId },
      relations: ['certificates', 'variations'],
      order: { careCategory: 'ASC' },
    });

    return {
      message: `${configs.length} configuraciones encontradas`,
      data: configs,
      meta: {
        providerId,
        total: configs.length,
      },
    };
  }

  /**
   * Obtener configuraciones por categoría
   */
  async findByCategory(careCategory: string, limit: number = 20) {
    const configs = await this.serviceConfigRepository.find({
      where: { careCategory, completed: true },
      relations: ['provider'],
      order: { hourlyRate: 'ASC' },
      take: limit,
    });

    return {
      message: `${configs.length} servicios de ${careCategory} encontrados`,
      data: configs,
      meta: {
        careCategory,
        total: configs.length,
      },
    };
  }

  /**
   * Actualizar configuración
   */
  async update(
    id: number,
    updateServiceConfigDto: UpdateServiceConfigDto,
    updatedBy: number,
  ) {
    const config = await this.serviceConfigRepository.findOne({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuración de servicio con ID ${id} no encontrada`,
      );
    }

    // Prevenir cambio de providerId
    if (
      updateServiceConfigDto.providerId &&
      updateServiceConfigDto.providerId !== config.providerId
    ) {
      throw new BadRequestException(
        'No se puede cambiar el proveedor asociado',
      );
    }

    // Actualizar con auditoría
    Object.assign(config, updateServiceConfigDto, { updatedBy });

    const updatedConfig = await this.serviceConfigRepository.save(config);

    return {
      message: 'Configuración de servicio actualizada exitosamente',
      data: updatedConfig,
    };
  }

  /**
   * Eliminar configuración (soft delete)
   */
  async remove(id: number, deletedBy: number) {
    const config = await this.serviceConfigRepository.findOne({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuración de servicio con ID ${id} no encontrada`,
      );
    }

    // Soft delete con auditoría
    config.deletedBy = deletedBy;
    await this.serviceConfigRepository.save(config);
    await this.serviceConfigRepository.softDelete(id);

    return {
      message: 'Configuración de servicio eliminada exitosamente',
      data: config,
    };
  }
}
