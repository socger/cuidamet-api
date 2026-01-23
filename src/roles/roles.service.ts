import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResultDto } from '../common/dto/pagination-result.dto';
import { RoleFiltersDto } from './dto/role-filters.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    filtersDto?: RoleFiltersDto,
  ): Promise<PaginationResultDto<Role>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    // Crear query builder
    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.users', 'user')
      .select([
        'role.id',
        'role.name',
        'role.description',
        'role.createdAt',
        'role.updatedAt',
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
      ]);

    // Aplicar filtros
    this.applyRoleFilters(queryBuilder, filtersDto);

    // Aplicar ordenación - SIMPLIFICAR
    if (filtersDto?.sortBy) {
      if (filtersDto.sortBy === 'userCount') {
        // Para ordenar por cantidad de usuarios, usar subconsulta - CORREGIR COLUMNAS
        queryBuilder.addSelect(
          '(SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = role.id)',
          'userCount',
        );
        queryBuilder.orderBy('userCount', filtersDto.sortOrder || 'ASC');
      } else {
        const sortField = `role.${filtersDto.sortBy}`;
        queryBuilder.orderBy(sortField, filtersDto.sortOrder || 'ASC');
      }
    } else {
      queryBuilder.orderBy('role.name', 'ASC');
    }

    // Obtener total sin paginación
    const countQueryBuilder = this.roleRepository.createQueryBuilder('role');

    // Aplicar los mismos filtros para el conteo
    this.applyRoleFiltersForCount(countQueryBuilder, filtersDto);
    const total = await countQueryBuilder.getCount();

    // Obtener datos paginados
    const roles = await queryBuilder.skip(skip).take(limit).getMany();

    return new PaginationResultDto(roles, total, page, limit);
  }

  private applyRoleFilters(
    queryBuilder: SelectQueryBuilder<Role>,
    filters?: RoleFiltersDto,
  ): void {
    if (!filters) return;

    // Búsqueda general (en name y description)
    if (filters.search) {
      queryBuilder.andWhere(
        '(role.name LIKE :search OR role.description LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Filtro por nombre específico
    if (filters.name) {
      queryBuilder.andWhere('role.name LIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    // Filtro por descripción
    if (filters.description) {
      queryBuilder.andWhere('role.description LIKE :description', {
        description: `%${filters.description}%`,
      });
    }

    // Filtro por rango de fechas de creación
    if (filters.createdFrom) {
      queryBuilder.andWhere('role.createdAt >= :createdFrom', {
        createdFrom: new Date(filters.createdFrom + ' 00:00:00'),
      });
    }

    if (filters.createdTo) {
      queryBuilder.andWhere('role.createdAt <= :createdTo', {
        createdTo: new Date(filters.createdTo + ' 23:59:59'),
      });
    }

    // CORREGIR: Filtros por cantidad de usuarios
    // Solo aplicar GROUP BY y HAVING si hay filtros de usuarios
    if (filters.minUsers !== undefined || filters.maxUsers !== undefined) {
      // Usar subconsulta para contar usuarios - CORREGIR NOMBRE DE TABLA
      if (filters.minUsers !== undefined) {
        queryBuilder.andWhere(
          '(SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = role.id) >= :minUsers',
          { minUsers: filters.minUsers },
        );
      }

      if (filters.maxUsers !== undefined) {
        queryBuilder.andWhere(
          '(SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = role.id) <= :maxUsers',
          { maxUsers: filters.maxUsers },
        );
      }
    }
  }

  private buildWhereClause(filters?: RoleFiltersDto): string {
    const conditions: string[] = [];

    if (filters?.search) {
      conditions.push(
        `(role.name LIKE '%${filters.search}%' OR role.description LIKE '%${filters.search}%')`,
      );
    }

    if (filters?.name) {
      conditions.push(`role.name LIKE '%${filters.name}%'`);
    }

    if (filters?.description) {
      conditions.push(`role.description LIKE '%${filters.description}%'`);
    }

    if (filters?.createdFrom) {
      conditions.push(`role.createdAt >= '${filters.createdFrom} 00:00:00'`);
    }

    if (filters?.createdTo) {
      conditions.push(`role.createdAt <= '${filters.createdTo} 23:59:59'`);
    }

    return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  }

  // Método específico para búsqueda rápida
  async search(searchTerm: string, limit: number = 10): Promise<Role[]> {
    return this.roleRepository
      .createQueryBuilder('role')
      .where(
        'role.name LIKE :searchTerm OR role.description LIKE :searchTerm',
        {
          searchTerm: `%${searchTerm}%`,
        },
      )
      .select(['role.id', 'role.name', 'role.description'])
      .limit(limit)
      .getMany();
  }

  // Resto de métodos existentes...
  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users'],
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        users: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name },
    });
  }

  async create(
    createRoleDto: CreateRoleDto,
    createdBy?: number,
  ): Promise<Role> {
    const existingRole = await this.findByName(createRoleDto.name);
    if (existingRole) {
      throw new ConflictException(
        `Ya existe un rol con el nombre "${createRoleDto.name}"`,
      );
    }

    const role = this.roleRepository.create({
      ...createRoleDto,
      createdBy,
    });
    return this.roleRepository.save(role);
  }

  async update(
    id: number,
    updateRoleDto: UpdateRoleDto,
    updatedBy?: number,
  ): Promise<Role> {
    const role = await this.findOne(id);

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.findByName(updateRoleDto.name);
      if (existingRole) {
        throw new ConflictException(
          `Ya existe un rol con el nombre "${updateRoleDto.name}"`,
        );
      }
    }

    Object.assign(role, updateRoleDto);
    if (updatedBy) {
      role.updatedBy = updatedBy;
    }
    return this.roleRepository.save(role);
  }

  async remove(id: number, deletedBy?: number): Promise<void> {
    const role = await this.findOne(id);

    // Soft delete con información de auditoría
    if (deletedBy) {
      role.deletedBy = deletedBy;
    }

    await this.roleRepository.softRemove(role);
  }

  private applyRoleFiltersForCount(
    queryBuilder: SelectQueryBuilder<Role>,
    filters?: RoleFiltersDto,
  ): void {
    if (!filters) return;

    // Aplicar los mismos filtros pero sin JOIN para evitar duplicados en el conteo
    if (filters.search) {
      queryBuilder.andWhere(
        '(role.name LIKE :search OR role.description LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.name) {
      queryBuilder.andWhere('role.name LIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters.description) {
      queryBuilder.andWhere('role.description LIKE :description', {
        description: `%${filters.description}%`,
      });
    }

    if (filters.createdFrom) {
      queryBuilder.andWhere('role.createdAt >= :createdFrom', {
        createdFrom: new Date(filters.createdFrom + ' 00:00:00'),
      });
    }

    if (filters.createdTo) {
      queryBuilder.andWhere('role.createdAt <= :createdTo', {
        createdTo: new Date(filters.createdTo + ' 23:59:59'),
      });
    }

    // Filtros por cantidad de usuarios - CORREGIR NOMBRE DE TABLA
    if (filters.minUsers !== undefined) {
      queryBuilder.andWhere(
        '(SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = role.id) >= :minUsers',
        { minUsers: filters.minUsers },
      );
    }

    if (filters.maxUsers !== undefined) {
      queryBuilder.andWhere(
        '(SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = role.id) <= :maxUsers',
        { maxUsers: filters.maxUsers },
      );
    }
  }
}
