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

  // Campos comunes de perfil (movidos desde provider_profiles y client_profiles)
  @Column({ length: 15, nullable: true })
  phone: string;

  @Column({ name: 'photo_url', type: 'mediumtext', nullable: true })
  photoUrl: string;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'simple-array', nullable: true })
  languages: string[];

  @Column({ name: 'is_premium', default: false })
  isPremium: boolean;

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
