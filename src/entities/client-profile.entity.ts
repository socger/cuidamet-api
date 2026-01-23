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

  @Column({ length: 100 })
  @ApiProperty({ 
    description: 'Nombre completo del cliente', 
    example: 'María García López' 
  })
  name: string;

  @Column({ length: 15, nullable: true })
  @ApiProperty({ 
    description: 'Número de teléfono', 
    example: '+34612345678',
    required: false 
  })
  phone: string;

  @Column({ name: 'photo_url', length: 500, nullable: true })
  @ApiProperty({ 
    description: 'URL de la foto de perfil', 
    example: 'https://example.com/photos/user123.jpg',
    required: false 
  })
  photoUrl: string;

  @Column({ length: 255 })
  @ApiProperty({ 
    description: 'Ubicación del cliente', 
    example: 'Madrid, España' 
  })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  @ApiProperty({ 
    description: 'Latitud de la ubicación', 
    example: 40.4168,
    required: false 
  })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  @ApiProperty({ 
    description: 'Longitud de la ubicación', 
    example: -3.7038,
    required: false 
  })
  longitude: number;

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({ 
    description: 'Idiomas que habla el cliente', 
    example: ['Español', 'Inglés'],
    type: [String],
    required: false 
  })
  languages: string[];

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

  @Column({ name: 'is_premium', default: false })
  @ApiProperty({ 
    description: 'Indica si el cliente tiene suscripción premium', 
    example: false,
    default: false 
  })
  isPremium: boolean;
}
