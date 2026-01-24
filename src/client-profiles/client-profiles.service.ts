import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProfile } from '../entities/client-profile.entity';
import { User } from '../entities/user.entity';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { ClientProfileFiltersDto } from './dto/client-profile-filters.dto';

@Injectable()
export class ClientProfilesService {
  constructor(
    @InjectRepository(ClientProfile)
    private readonly clientProfileRepository: Repository<ClientProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Crear nuevo perfil de cliente
   */
  async create(
    createDto: CreateClientProfileDto,
    createdBy?: number,
  ): Promise<ClientProfile> {
    // Validar que el usuario existe
    const user = await this.userRepository.findOne({
      where: { id: createDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuario con ID ${createDto.userId} no encontrado`,
      );
    }

    // Validar que el usuario no tenga ya un perfil de cliente
    const existingProfile = await this.clientProfileRepository.findOne({
      where: { userId: createDto.userId },
    });

    if (existingProfile) {
      throw new ConflictException(
        `El usuario con ID ${createDto.userId} ya tiene un perfil de cliente`,
      );
    }

    const profile = this.clientProfileRepository.create({
      ...createDto,
      createdBy,
    });

    return this.clientProfileRepository.save(profile);
  }

  /**
   * Obtener todos los perfiles con filtros y paginación
   */
  async findAll(filters: ClientProfileFiltersDto) {
    const {
      search,
      name,
      location,
      language,
      preference,
      profileStatus,
      isPremium,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const query = this.clientProfileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user');

    // Búsqueda general
    if (search) {
      query.andWhere(
        '(profile.name LIKE :search OR profile.location LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filtros específicos
    if (name) {
      query.andWhere('profile.name LIKE :name', { name: `%${name}%` });
    }

    if (location) {
      query.andWhere('profile.location LIKE :location', {
        location: `%${location}%`,
      });
    }

    if (language) {
      query.andWhere('profile.languages LIKE :language', {
        language: `%${language}%`,
      });
    }

    if (preference) {
      query.andWhere('profile.preferences LIKE :preference', {
        preference: `%${preference}%`,
      });
    }

    if (profileStatus) {
      query.andWhere('profile.profileStatus = :profileStatus', {
        profileStatus,
      });
    }

    if (isPremium !== undefined) {
      // Convertir booleano a número para MySQL (0 o 1)
      query.andWhere('profile.isPremium = :isPremium', { 
        isPremium: isPremium ? 1 : 0 
      });
    }

    // Ordenamiento
    const allowedSortFields = ['name', 'location', 'createdAt', 'updatedAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    query.orderBy(`profile.${sortField}`, sortOrder);

    // Paginación
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

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
   * Obtener perfil por ID
   */
  async findOne(id: number): Promise<ClientProfile> {
    const profile = await this.clientProfileRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(`Perfil de cliente con ID ${id} no encontrado`);
    }

    return profile;
  }

  /**
   * Obtener perfil por userId
   */
  async findByUserId(userId: number): Promise<ClientProfile> {
    const profile = await this.clientProfileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(
        `Perfil de cliente para usuario con ID ${userId} no encontrado`,
      );
    }

    return profile;
  }

  /**
   * Actualizar perfil de cliente
   */
  async update(
    id: number,
    updateDto: UpdateClientProfileDto,
    updatedBy?: number,
  ): Promise<ClientProfile> {
    const profile = await this.findOne(id);

    // No permitir cambiar el userId
    if (updateDto.userId && updateDto.userId !== profile.userId) {
      throw new BadRequestException(
        'No se puede cambiar el usuario asociado al perfil',
      );
    }

    Object.assign(profile, updateDto);
    if (updatedBy) {
      profile.updatedBy = updatedBy;
    }

    return this.clientProfileRepository.save(profile);
  }

  /**
   * Eliminar perfil (soft delete)
   */
  async remove(id: number, deletedBy?: number): Promise<void> {
    const profile = await this.findOne(id);

    if (deletedBy) {
      profile.deletedBy = deletedBy;
      await this.clientProfileRepository.save(profile);
    }

    await this.clientProfileRepository.softRemove(profile);
  }

  /**
   * Buscar perfiles por preferencia de categoría
   */
  async findByPreference(preference: string): Promise<ClientProfile[]> {
    return this.clientProfileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.preferences LIKE :preference', {
        preference: `%${preference}%`,
      })
      .andWhere('profile.profileStatus = :status', { status: 'published' })
      .getMany();
  }

  /**
   * Buscar perfiles por ubicación cercana (radio en km)
   */
  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
  ): Promise<ClientProfile[]> {
    // Fórmula Haversine para calcular distancia
    const query = `
      SELECT *, 
        (6371 * acos(
          cos(radians(?)) * 
          cos(radians(latitude)) * 
          cos(radians(longitude) - radians(?)) + 
          sin(radians(?)) * 
          sin(radians(latitude))
        )) AS distance
      FROM client_profiles
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND profile_status = 'published'
      HAVING distance < ?
      ORDER BY distance
    `;

    return this.clientProfileRepository.query(query, [
      latitude,
      longitude,
      latitude,
      radiusKm,
    ]);
  }
}
