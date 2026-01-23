import { AppDataSource } from '../data-source';
import { Role } from '../../entities/role.entity';

export class RoleSeeder {
  public async run(): Promise<void> {
    const roleRepository = AppDataSource.getRepository(Role);

    const roles = [
      {
        name: 'admin',
        description: 'Administrador con acceso completo al sistema',
      },
      {
        name: 'moderator',
        description:
          'Moderador con permisos de gestión de usuarios y contenido',
      },
      {
        name: 'user',
        description: 'Usuario estándar con acceso básico',
      },
    ];

    for (const roleData of roles) {
      const existingRole = await roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        const role = roleRepository.create(roleData);
        await roleRepository.save(role);
        console.log(`✅ Rol creado: ${roleData.name}`);
      } else {
        console.log(`ℹ️  Rol ya existe: ${roleData.name}`);
      }
    }
  }
}
