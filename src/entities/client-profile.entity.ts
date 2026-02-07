import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entidad para el perfil de clientes/familias
 * Usuarios que buscan servicios de cuidado
 */
@Entity('client_profiles')
export class ClientProfile extends BaseEntity {
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({ description: 'Usuario asociado al perfil', type: () => User })
  user: User;

  @Column({ name: 'user_id', unique: true })
  @ApiProperty({ description: 'ID del usuario', example: 1 })
  userId: number;

  // NOTA: Los campos phone, photoUrl, location, latitude, longitude, languages e isPremium
  // han sido movidos a la entidad User para evitar duplicación entre perfiles

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({ 
    description: 'Categorías de cuidado que le interesan', 
    example: ['Elderly Care', 'Child Care'],
    type: [String],
    required: false 
  })
  preferences: string[];

  @Column({ name: 'profile_status', default: 'draft' })
  @ApiProperty({ 
    description: 'Estado del perfil', 
    enum: ['draft', 'published', 'suspended'],
    example: 'published',
    default: 'draft'
  })
  profileStatus: string;

  // NOTA: El campo isPremium ha sido movido a la entidad User
}
