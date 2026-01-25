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
      name,
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
        '(provider.name LIKE :search OR ' +
          'provider.location LIKE :search OR ' +
          'provider.languages LIKE :search OR ' +
          'provider.verifications LIKE :search OR ' +
          'provider.badges LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filtros específicos
    if (name) {
      queryBuilder.andWhere('provider.name LIKE :name', { name: `%${name}%` });
    }

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

    return {
      message: 'Perfil de proveedor encontrado',
      data: profile,
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

    return {
      message: 'Perfil de proveedor encontrado',
      data: profile,
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
}
