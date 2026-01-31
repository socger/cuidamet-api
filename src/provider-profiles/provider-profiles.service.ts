import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderProfile } from '../entities/provider-profile.entity';
import { User } from '../entities/user.entity';
import { ServiceConfig } from '../entities/service-config.entity';
import { Certificate } from '../entities/certificate.entity';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { ProviderProfileFiltersDto } from './dto/provider-profile-filters.dto';

@Injectable()
export class ProviderProfilesService {
  constructor(
    @InjectRepository(ProviderProfile)
    private readonly providerProfileRepository: Repository<ProviderProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ServiceConfig)
    private readonly serviceConfigRepository: Repository<ServiceConfig>,
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
  ) {}

  /**
   * Crear un nuevo perfil de proveedor
   */
  async create(
    createProviderProfileDto: CreateProviderProfileDto,
    createdBy: number,
  ) {
    // Validar que el usuario exista
    const user = await this.userRepository.findOne({
      where: { id: createProviderProfileDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuario con ID ${createProviderProfileDto.userId} no encontrado`,
      );
    }

    // Validar que el usuario no tenga ya un perfil de proveedor
    const existingProfile = await this.providerProfileRepository.findOne({
      where: { userId: createProviderProfileDto.userId },
    });

    if (existingProfile) {
      throw new ConflictException(
        `El usuario con ID ${createProviderProfileDto.userId} ya tiene un perfil de proveedor`,
      );
    }

    // Crear el perfil con auditoría
    const profile = this.providerProfileRepository.create({
      ...createProviderProfileDto,
      createdBy,
    });

    const savedProfile = await this.providerProfileRepository.save(profile);

    return {
      message: 'Perfil de proveedor creado exitosamente',
      data: savedProfile,
    };
  }

  /**
   * Listar perfiles de proveedores con filtros avanzados y paginación
   */
  async findAll(filters: ProviderProfileFiltersDto) {
    const {
      search,
      location,
      language,
      availability,
      profileStatus,
      isPremium,
      providerStatus,
      minRating,
      minReviews,
      minCompletedBookings,
      verification,
      badge,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder = this.providerProfileRepository.createQueryBuilder('provider');

    // Búsqueda general
    if (search) {
      queryBuilder.andWhere(
        '(provider.location LIKE :search OR ' +
          'provider.languages LIKE :search OR ' +
          'provider.verifications LIKE :search OR ' +
          'provider.badges LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filtros específicos
    if (location) {
      queryBuilder.andWhere('provider.location LIKE :location', {
        location: `%${location}%`,
      });
    }

    if (language) {
      queryBuilder.andWhere('provider.languages LIKE :language', {
        language: `%${language}%`,
      });
    }

    if (availability) {
      queryBuilder.andWhere('provider.availability LIKE :availability', {
        availability: `%${availability}%`,
      });
    }

    if (profileStatus) {
      queryBuilder.andWhere('provider.profileStatus = :profileStatus', {
        profileStatus,
      });
    }

    if (typeof isPremium === 'boolean') {
      queryBuilder.andWhere('provider.isPremium = :isPremium', {
        isPremium: isPremium ? 1 : 0,
      });
    }

    if (providerStatus) {
      queryBuilder.andWhere('provider.providerStatus = :providerStatus', {
        providerStatus,
      });
    }

    if (minRating !== undefined) {
      queryBuilder.andWhere('provider.rating >= :minRating', { minRating });
    }

    if (minReviews !== undefined) {
      queryBuilder.andWhere('provider.reviewsCount >= :minReviews', {
        minReviews,
      });
    }

    if (minCompletedBookings !== undefined) {
      queryBuilder.andWhere(
        'provider.completedBookings >= :minCompletedBookings',
        { minCompletedBookings },
      );
    }

    if (verification) {
      queryBuilder.andWhere('provider.verifications LIKE :verification', {
        verification: `%${verification}%`,
      });
    }

    if (badge) {
      queryBuilder.andWhere('provider.badges LIKE :badge', {
        badge: `%${badge}%`,
      });
    }

    // Ordenamiento
    const orderField = `provider.${sortBy}`;
    queryBuilder.orderBy(orderField, sortOrder);

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Ejecutar query con contador
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
   * Obtener un perfil de proveedor por ID
   */
  async findOne(id: number) {
    const profile = await this.providerProfileRepository.findOne({
      where: { id },
      relations: ['user', 'services'],
    });

    if (!profile) {
      throw new NotFoundException(`Perfil de proveedor con ID ${id} no encontrado`);
    }

    // Obtener estadísticas de certificados
    const certificatesStats = await this.getCertificatesStats(id);

    return {
      message: 'Perfil de proveedor encontrado',
      data: {
        ...profile,
        certificatesStats,
      },
    };
  }

  /**
   * Obtener perfil de proveedor por userId
   */
  async findByUserId(userId: number) {
    const profile = await this.providerProfileRepository.findOne({
      where: { userId },
      relations: ['user', 'services'],
    });

    if (!profile) {
      throw new NotFoundException(
        `Perfil de proveedor para usuario ${userId} no encontrado`,
      );
    }

    // Obtener estadísticas de certificados
    const certificatesStats = await this.getCertificatesStats(profile.id);

    return {
      message: 'Perfil de proveedor encontrado',
      data: {
        ...profile,
        certificatesStats,
      },
    };
  }

  /**
   * Actualizar perfil de proveedor
   */
  async update(
    id: number,
    updateProviderProfileDto: UpdateProviderProfileDto,
    updatedBy: number,
  ) {
    const profile = await this.providerProfileRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`Perfil de proveedor con ID ${id} no encontrado`);
    }

    // Prevenir cambio de userId
    if (
      updateProviderProfileDto.userId &&
      updateProviderProfileDto.userId !== profile.userId
    ) {
      throw new BadRequestException('No se puede cambiar el usuario asociado');
    }

    // Actualizar campos con auditoría
    Object.assign(profile, updateProviderProfileDto, { updatedBy });

    const updatedProfile = await this.providerProfileRepository.save(profile);

    return {
      message: 'Perfil de proveedor actualizado exitosamente',
      data: updatedProfile,
    };
  }

  /**
   * Eliminar perfil de proveedor (soft delete)
   */
  async remove(id: number, deletedBy: number) {
    const profile = await this.providerProfileRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`Perfil de proveedor con ID ${id} no encontrado`);
    }

    // Soft delete con auditoría
    profile.deletedBy = deletedBy;
    await this.providerProfileRepository.save(profile);
    await this.providerProfileRepository.softDelete(id);

    return {
      message: 'Perfil de proveedor eliminado exitosamente',
      data: profile,
    };
  }

  /**
   * Buscar proveedores cercanos (geolocalización)
   */
  async findNearby(latitude: number, longitude: number, radiusKm: number = 10) {
    // Fórmula Haversine para calcular distancia
    const query = this.providerProfileRepository
      .createQueryBuilder('provider')
      .where('provider.latitude IS NOT NULL')
      .andWhere('provider.longitude IS NOT NULL')
      .andWhere('provider.profileStatus = :status', { status: 'published' })
      .select([
        'provider.*',
        `(6371 * acos(cos(radians(:lat)) * cos(radians(provider.latitude)) * 
         cos(radians(provider.longitude) - radians(:lng)) + 
         sin(radians(:lat)) * sin(radians(provider.latitude)))) AS distance`,
      ])
      .having('distance <= :radius')
      .orderBy('distance', 'ASC')
      .setParameters({
        lat: latitude,
        lng: longitude,
        radius: radiusKm,
      });

    const providers = await query.getRawMany();

    return {
      message: `${providers.length} proveedores encontrados en un radio de ${radiusKm} km`,
      data: providers,
      meta: {
        latitude,
        longitude,
        radiusKm,
        total: providers.length,
      },
    };
  }

  /**
   * Buscar proveedores por calificación mínima
   */
  async findTopRated(minRating: number = 4.5, limit: number = 10) {
    const providers = await this.providerProfileRepository.find({
      where: { profileStatus: 'published' },
      order: {
        rating: 'DESC',
        reviewsCount: 'DESC',
      },
      take: limit,
    });

    const filtered = providers.filter((p) => p.rating >= minRating);

    return {
      message: `${filtered.length} proveedores mejor valorados encontrados`,
      data: filtered,
      meta: {
        minRating,
        total: filtered.length,
      },
    };
  }

  /**
   * Buscar proveedores premium
   */
  async findPremium(limit: number = 10) {
    const providers = await this.providerProfileRepository.find({
      where: {
        isPremium: true,
        profileStatus: 'published',
      },
      order: {
        rating: 'DESC',
        completedBookings: 'DESC',
      },
      take: limit,
    });

    return {
      message: `${providers.length} proveedores premium encontrados`,
      data: providers,
      meta: {
        total: providers.length,
      },
    };
  }

  /**
   * Método auxiliar: Obtener estadísticas de certificados para todas las configuraciones de servicios
   * de un perfil de proveedor
   */
  private async getCertificatesStats(profileId: number) {
    // Obtener todos los service configs del proveedor
    const serviceConfigs = await this.serviceConfigRepository.find({
      where: { providerId: profileId },
      select: ['id'],
    });

    if (serviceConfigs.length === 0) {
      return {
        totalCertificates: 0,
        maxLimit: Number(process.env.MAX_CERTIFICATES_PER_USER || 10),
        remaining: Number(process.env.MAX_CERTIFICATES_PER_USER || 10),
        canUploadMore: true,
        byServiceConfig: [],
      };
    }

    const serviceConfigIds = serviceConfigs.map(sc => sc.id);

    // Contar certificados agrupados por serviceConfigId
    const certificateCounts = await this.certificateRepository
      .createQueryBuilder('certificate')
      .select('certificate.serviceConfigId', 'serviceConfigId')
      .addSelect('COUNT(certificate.id)', 'count')
      .where('certificate.serviceConfigId IN (:...ids)', { ids: serviceConfigIds })
      .groupBy('certificate.serviceConfigId')
      .getRawMany();

    const maxLimit = Number(process.env.MAX_CERTIFICATES_PER_USER || 10);
    const totalCertificates = certificateCounts.reduce((sum, item) => sum + Number(item.count), 0);

    // Crear detalle por serviceConfig
    const byServiceConfig = serviceConfigs.map(sc => {
      const countData = certificateCounts.find(cc => cc.serviceConfigId === sc.id);
      const count = countData ? Number(countData.count) : 0;
      return {
        serviceConfigId: sc.id,
        count,
        maxLimit,
        remaining: Math.max(0, maxLimit - count),
        canUploadMore: count < maxLimit,
      };
    });

    // Calcular promedio/total
    const avgRemaining = Math.floor(byServiceConfig.reduce((sum, item) => sum + item.remaining, 0) / serviceConfigs.length);

    return {
      totalCertificates,
      maxLimit,
      remaining: avgRemaining,
      canUploadMore: byServiceConfig.some(item => item.canUploadMore),
      byServiceConfig,
    };
  }
}
