import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder } from 'typeorm'; // Añadir SelectQueryBuilder
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { ClientProfile } from '../entities/client-profile.entity';
import { ProviderProfile } from '../entities/provider-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResultDto } from '../common/dto/pagination-result.dto';
import { UserFiltersDto } from './dto/user-filters.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(ClientProfile)
    private readonly clientProfileRepository: Repository<ClientProfile>,
    @InjectRepository(ProviderProfile)
    private readonly providerProfileRepository: Repository<ProviderProfile>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    filtersDto?: UserFiltersDto,
  ): Promise<PaginationResultDto<User>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    // Crear query builder
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.isActive',
        'user.createdAt',
        'role.id',
        'role.name',
        'role.description',
      ]);

    // Aplicar filtros
    this.applyUserFilters(queryBuilder, filtersDto);

    // Aplicar ordenación
    if (filtersDto?.sortBy) {
      const sortField =
        filtersDto.sortBy === 'createdAt'
          ? 'user.createdAt'
          : `user.${filtersDto.sortBy}`;
      queryBuilder.orderBy(sortField, filtersDto.sortOrder || 'DESC');
    } else {
      queryBuilder.orderBy('user.createdAt', 'DESC');
    }

    // Obtener total y datos paginados
    const total = await queryBuilder.getCount();
    const users = await queryBuilder.skip(skip).take(limit).getMany();

    return new PaginationResultDto(users, total, page, limit);
  }

  private applyUserFilters(
    queryBuilder: SelectQueryBuilder<User>,
    filters?: UserFiltersDto,
  ): void {
    if (!filters) return;

    // Búsqueda general (en username, email, firstName, lastName)
    if (filters.search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Filtro por username específico
    if (filters.username) {
      queryBuilder.andWhere('user.username LIKE :username', {
        username: `%${filters.username}%`,
      });
    }

    // Filtro por email específico
    if (filters.email) {
      queryBuilder.andWhere('user.email LIKE :email', {
        email: `%${filters.email}%`,
      });
    }

    // Filtro por firstName
    if (filters.firstName) {
      queryBuilder.andWhere('user.firstName LIKE :firstName', {
        firstName: `%${filters.firstName}%`,
      });
    }

    // Filtro por lastName
    if (filters.lastName) {
      queryBuilder.andWhere('user.lastName LIKE :lastName', {
        lastName: `%${filters.lastName}%`,
      });
    }

    // Filtro por estado activo/inactivo
    if (typeof filters.isActive === 'boolean') {
      // ⚠️ IMPORTANTE: Convertir booleano a número para MySQL TINYINT(1)
      // Sin esto, la query SQL genera WHERE is_active = true/false en lugar de WHERE is_active = 0/1
      // Ver documentación: resources/documents/AI conversations/.../035-BOOLEAN-FILTERS-FIX.md
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive: filters.isActive ? 1 : 0,
      });
    }

    // Filtro por rol específico (por nombre)
    if (filters.roleName) {
      queryBuilder.andWhere('role.name = :roleName', {
        roleName: filters.roleName,
      });
    }

    // Filtro por ID de rol específico
    if (filters.roleId) {
      queryBuilder.andWhere('role.id = :roleId', { roleId: filters.roleId });
    }

    // Filtro por rango de fechas de creación
    if (filters.createdFrom) {
      queryBuilder.andWhere('user.createdAt >= :createdFrom', {
        createdFrom: new Date(filters.createdFrom + ' 00:00:00'),
      });
    }

    if (filters.createdTo) {
      queryBuilder.andWhere('user.createdAt <= :createdTo', {
        createdTo: new Date(filters.createdTo + ' 23:59:59'),
      });
    }
  }

  // Método específico para búsqueda rápida
  async search(searchTerm: string, limit: number = 10): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where(
        'user.username LIKE :searchTerm OR user.email LIKE :searchTerm OR user.firstName LIKE :searchTerm OR user.lastName LIKE :searchTerm',
        { searchTerm: `%${searchTerm}%` },
      )
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.isActive',
        'role.id',
        'role.name',
      ])
      .limit(limit)
      .getMany();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'isActive',
        'createdAt',
      ],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  /**
   * Obtener usuario con toda su información de perfil completa
   * Incluye clientProfile, providerProfile (con services y variations)
   * @param id ID del usuario
   * @returns Usuario con perfiles completos
   */
  async findOneWithProfiles(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'roles',
        'clientProfile',
        'providerProfile',
        'providerProfile.services',
        'providerProfile.services.variations',
      ],
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'isActive',
        'emailVerified',
        'createdAt',
      ],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['roles'],
    });
  }

  /**
   * Obtener perfiles de cliente y proveedor de un usuario
   * @param userId ID del usuario
   * @returns Objeto con clientProfile y providerProfile (si existen)
   */
  async getUserProfiles(userId: number): Promise<{
    clientProfile: any | null;
    providerProfile: any | null;
    hasProfiles: boolean;
    profileType: 'none' | 'client' | 'provider' | 'both';
  }> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clientProfile', 'providerProfile'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const hasClientProfile = !!user.clientProfile;
    const hasProviderProfile = !!user.providerProfile;

    let profileType: 'none' | 'client' | 'provider' | 'both' = 'none';
    if (hasClientProfile && hasProviderProfile) {
      profileType = 'both';
    } else if (hasClientProfile) {
      profileType = 'client';
    } else if (hasProviderProfile) {
      profileType = 'provider';
    }

    return {
      clientProfile: user.clientProfile || null,
      providerProfile: user.providerProfile || null,
      hasProfiles: hasClientProfile || hasProviderProfile,
      profileType,
    };
  }

  async create(
    createUserDto: CreateUserDto,
    createdBy?: number,
  ): Promise<User> {
    // VALIDAR DUPLICADOS ANTES DE CREAR
    const existingEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingEmail) {
      throw new ConflictException(`El email ya está registrado`);
    }

    const existingUsername = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });

    if (existingUsername) {
      throw new ConflictException(`El username ya está en uso`);
    }

    // Obtener roles si se proporcionan
    let roles: Role[] = [];
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      roles = await this.roleRepository.findBy({
        id: In(createUserDto.roleIds),
      });

      if (roles.length !== createUserDto.roleIds.length) {
        throw new NotFoundException('Uno o más roles no existen');
      }
    } else {
      // Asignar rol 'user' por defecto si no se especifica
      const defaultRole = await this.roleRepository.findOne({
        where: { name: 'user' },
      });
      if (defaultRole) {
        roles = [defaultRole];
      }
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Crear usuario con información de auditoría
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      roles,
      createdBy,
    });

    return this.userRepository.save(user);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    updatedBy?: number,
  ): Promise<User> {
    const user = await this.findOne(id);

    // VALIDAR DUPLICADOS SI SE CAMBIA EMAIL O USERNAME
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException(`El email ya está registrado`);
      }
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUsername) {
        throw new ConflictException(`El username ya está en uso`);
      }
    }

    // Hashear nueva contraseña si se proporciona
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Manejar actualización de roles si se proporcionan
    if (updateUserDto.roleIds) {
      const roles = await this.roleRepository.findBy({
        id: In(updateUserDto.roleIds),
      });

      if (roles.length !== updateUserDto.roleIds.length) {
        throw new NotFoundException('Uno o más roles no existen');
      }

      user.roles = roles;
    }

    // Aplicar otros cambios y auditoría
    Object.assign(user, updateUserDto);
    if (updatedBy) {
      user.updatedBy = updatedBy;
    }

    return this.userRepository.save(user);
  }

  async remove(id: number, deletedBy?: number): Promise<void> {
    const user = await this.findOne(id);

    // Soft delete con información de auditoría
    if (deletedBy) {
      user.deletedBy = deletedBy;
    }

    await this.userRepository.softRemove(user);
  }

  async assignRole(userId: number, roleId: number): Promise<User> {
    // Obtener usuario con sus roles
    const user = await this.findOne(userId);

    // Verificar que el rol existe
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
    }

    // Verificar que el usuario no tiene ya este rol
    const alreadyHasRole = user.roles.some(
      (userRole) => userRole.id === roleId,
    );

    if (alreadyHasRole) {
      throw new ConflictException(
        `El usuario ya tiene asignado el rol "${role.name}"`,
      );
    }

    // Asignar el nuevo rol
    user.roles.push(role);

    return this.userRepository.save(user);
  }

  async removeRole(userId: number, roleId: number): Promise<User> {
    // Obtener usuario con sus roles
    const user = await this.findOne(userId);

    // Verificar que el usuario tiene el rol que se quiere remover
    const hasRole = user.roles.some((role) => role.id === roleId);

    if (!hasRole) {
      throw new NotFoundException(
        `El usuario no tiene asignado el rol con ID ${roleId}`,
      );
    }

    // Verificar que el rol existe (opcional, pero recomendable)
    const roleToRemove = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!roleToRemove) {
      throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
    }

    // Filtrar el rol que se quiere remover
    user.roles = user.roles.filter((role) => role.id !== roleId);

    return this.userRepository.save(user);
  }

  /**
   * Cambiar el rol activo del usuario
   * ELIMINA el rol anterior y asigna el nuevo
   * Un usuario solo puede tener UN rol activo a la vez (client O provider, no ambos)
   * @param userId ID del usuario
   * @param roleName Nombre del rol a activar ('client' o 'provider')
   * @returns Objeto con el rol actualizado y el perfil correspondiente
   */
  async switchActiveRole(
    userId: number,
    roleName: 'client' | 'provider',
  ): Promise<{
    activeRole: string;
    profile: any | null;
    profileType: 'client' | 'provider' | 'none';
  }> {
    // 1. Obtener usuario con roles y perfiles
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'clientProfile', 'providerProfile'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // 2. Buscar el nuevo rol solicitado
    const newRole = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (!newRole) {
      throw new NotFoundException(`Rol "${roleName}" no encontrado`);
    }

    // 3. ELIMINAR todos los roles client/provider anteriores
    const rolesToRemove = ['client', 'provider'];
    user.roles = user.roles.filter(
      (role) => !rolesToRemove.includes(role.name),
    );

    console.log(
      `🗑️ Roles eliminados para usuario ${userId}. Asignando nuevo rol: "${roleName}"`,
    );

    // 4. Asignar SOLO el nuevo rol
    user.roles.push(newRole);
    await this.userRepository.save(user);

    console.log(`✅ Usuario ${userId} ahora tiene SOLO el rol "${roleName}"`);

    // 5. Cargar el perfil correspondiente con TODAS sus relaciones
    let profile = null;
    let profileType: 'client' | 'provider' | 'none' = 'none';

    if (roleName === 'client') {
      // Buscar clientProfile del usuario con la relación 'user'
      profile = await this.clientProfileRepository.findOne({
        where: { userId },
        relations: ['user'],
      });

      profileType = profile ? 'client' : 'none';
      console.log(
        `📦 Perfil familiar cargado:`,
        profile ? `ID=${profile.id}` : 'NO existe',
      );
    } else if (roleName === 'provider') {
      // Buscar providerProfile del usuario con TODAS sus relaciones
      // Incluye: user, services (ServiceConfig), variations y certificates
      profile = await this.providerProfileRepository.findOne({
        where: { userId },
        relations: [
          'user',
          'services',                    // Cargar ServiceConfigs
          'services.variations',         // Cargar ServiceVariations de cada servicio
          'services.certificates',       // Cargar Certificates de cada servicio
        ],
      });

      profileType = profile ? 'provider' : 'none';
      console.log(
        `📦 Perfil profesional cargado:`,
        profile ? `ID=${profile.id}` : 'NO existe',
        profile?.services ? `con ${profile.services.length} servicios` : '',
      );
    }

    if (!profile) {
      console.log(
        `⚠️ Usuario ${userId} no tiene perfil "${roleName}" - debe crearlo`,
      );
    }

    return {
      activeRole: roleName,
      profile,
      profileType,
    };
  }
}
