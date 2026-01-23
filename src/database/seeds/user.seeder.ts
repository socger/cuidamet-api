import { AppDataSource } from '../data-source';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import * as bcrypt from 'bcrypt';

export class UserSeeder {
  public async run(): Promise<void> {
    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);

    // Buscar roles
    const adminRole = await roleRepository.findOne({
      where: { name: 'admin' },
    });
    const moderatorRole = await roleRepository.findOne({
      where: { name: 'moderator' },
    });
    const userRole = await roleRepository.findOne({ where: { name: 'user' } });

    if (!adminRole || !moderatorRole || !userRole) {
      console.error(
        '❌ Error: Los roles no existen. Ejecuta primero el seeder de roles.',
      );
      return;
    }

    const users = [
      {
        username: 'admin',
        email: 'admin@socgerfleet.com',
        password: await bcrypt.hash('Admin123!', 10),
        firstName: 'Admin',
        lastName: 'System',
        isActive: true,
        emailVerified: true,
        roles: [adminRole],
      },
      {
        username: 'moderator',
        email: 'moderator@socgerfleet.com',
        password: await bcrypt.hash('Moderator123!', 10),
        firstName: 'Moderator',
        lastName: 'User',
        isActive: true,
        emailVerified: true,
        roles: [moderatorRole],
      },
      {
        username: 'testuser',
        email: 'user@socgerfleet.com',
        password: await bcrypt.hash('User123!', 10),
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        emailVerified: true,
        roles: [userRole],
      },
    ];

    for (const userData of users) {
      const existingUser = await userRepository.findOne({
        where: [{ username: userData.username }, { email: userData.email }],
      });

      if (!existingUser) {
        const user = userRepository.create(userData);
        await userRepository.save(user);
        console.log(
          `✅ Usuario creado: ${userData.username} (${userData.email})`,
        );
      } else {
        console.log(`ℹ️  Usuario ya existe: ${userData.username}`);
      }
    }
  }
}
