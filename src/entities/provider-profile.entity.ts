import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { ServiceConfig } from './service-config.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entidad para el perfil de proveedores/profesionales
 * Usuarios que ofrecen servicios de cuidado
 */
@Entity('provider_profiles')
export class ProviderProfile extends BaseEntity {
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({ description: 'Usuario asociado al perfil', type: () => User })
  user: User;

  @Column({ name: 'user_id', unique: true })
  @ApiProperty({ description: 'ID del usuario', example: 1 })
  userId: number;

  @Column({ length: 15, nullable: true })
  @ApiProperty({ 
    description: 'Número de teléfono', 
    example: '+34612345678',
    required: false 
  })
  phone: string;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  @ApiProperty({ 
    description: 'URL de la foto de perfil', 
    example: 'https://example.com/photos/provider123.jpg',
    required: false 
  })
  photoUrl: string;

  @Column({ length: 255 })
  @ApiProperty({ 
    description: 'Ubicación del proveedor', 
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
    description: 'Idiomas que habla el proveedor', 
    example: ['Español', 'Inglés'],
    type: [String],
    required: false 
  })
  languages: string[];

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({ 
    description: 'Disponibilidad agregada para búsqueda', 
    example: ['Mañanas', 'Tardes', 'Fines de semana'],
    type: [String],
    required: false 
  })
  availability: string[];

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
    description: 'Indica si el proveedor tiene suscripción premium', 
    example: false,
    default: false 
  })
  isPremium: boolean;

  @Column({ name: 'provider_status', default: 'offline' })
  @ApiProperty({ 
    description: 'Estado de disponibilidad del proveedor', 
    enum: ['available', 'busy', 'offline'],
    example: 'available',
    default: 'offline'
  })
  providerStatus: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, nullable: true })
  @ApiProperty({ 
    description: 'Calificación promedio del proveedor', 
    example: 4.8,
    minimum: 0,
    maximum: 5,
    required: false 
  })
  rating: number;

  @Column({ name: 'reviews_count', default: 0 })
  @ApiProperty({ 
    description: 'Número total de reseñas', 
    example: 42,
    default: 0 
  })
  reviewsCount: number;

  @Column({ name: 'completed_bookings', default: 0 })
  @ApiProperty({ 
    description: 'Número de servicios completados', 
    example: 127,
    default: 0 
  })
  completedBookings: number;

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({ 
    description: 'Verificaciones obtenidas', 
    example: ['DNI Verificado', 'Certificado de Primeros Auxilios'],
    type: [String],
    required: false 
  })
  verifications: string[];

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({ 
    description: 'Insignias y reconocimientos', 
    example: ['Premium', 'Mejor Valorado', 'Respuesta Rápida'],
    type: [String],
    required: false 
  })
  badges: string[];

  @OneToMany(() => ServiceConfig, (serviceConfig) => serviceConfig.provider)
  @ApiProperty({ 
    description: 'Configuración de servicios ofrecidos',
    type: () => [ServiceConfig]
  })
  services: ServiceConfig[];
}
