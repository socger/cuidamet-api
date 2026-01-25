import { Entity, Column, ManyToMany, JoinTable, OneToOne } from 'typeorm';
import { Role } from './role.entity';
import { ClientProfile } from './client-profile.entity';
import { ProviderProfile } from './provider-profile.entity';
import { Exclude } from 'class-transformer';
import { BaseEntity } from './base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ name: 'first_name', length: 50, nullable: true })
  firstName: string;

  @Column({ name: 'last_name', length: 50, nullable: true })
  lastName: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles: Role[];

  // Relación bidireccional con ClientProfile (opcional)
  @OneToOne(() => ClientProfile, (clientProfile) => clientProfile.user, {
    nullable: true,
  })
  clientProfile?: ClientProfile;

  // Relación bidireccional con ProviderProfile (opcional)
  @OneToOne(() => ProviderProfile, (providerProfile) => providerProfile.user, {
    nullable: true,
  })
  providerProfile?: ProviderProfile;
}
