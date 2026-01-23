import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProviderProfile } from './provider-profile.entity';
import { Certificate } from './certificate.entity';
import { ServiceVariation } from './service-variation.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entidad para la configuración de servicios ofrecidos por un proveedor
 * Cada registro representa un tipo de servicio configurado
 */
@Entity('service_configs')
export class ServiceConfig extends BaseEntity {
  @ManyToOne(() => ProviderProfile, (provider) => provider.services)
  @JoinColumn({ name: 'provider_id' })
  @ApiProperty({ 
    description: 'Proveedor que ofrece este servicio',
    type: () => ProviderProfile 
  })
  provider: ProviderProfile;

  @Column({ name: 'provider_id' })
  @ApiProperty({ description: 'ID del proveedor', example: 1 })
  providerId: number;

  @Column({ name: 'care_category' })
  @ApiProperty({ 
    description: 'Categoría de cuidado', 
    enum: ['Elderly Care', 'Child Care', 'Pet Care', 'Home Cleaning'],
    example: 'Elderly Care'
  })
  careCategory: string;

  @Column({ default: false })
  @ApiProperty({ 
    description: 'Indica si la configuración del servicio está completa', 
    example: true,
    default: false 
  })
  completed: boolean;

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({ 
    description: 'Lista de tareas/servicios específicos ofrecidos', 
    example: ['Gestión de Medicamentos', 'Compañía', 'Asistencia en Movilidad'],
    type: [String],
    required: false 
  })
  tasks: string[];

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2, default: 0 })
  @ApiProperty({ 
    description: 'Tarifa por hora base', 
    example: 15.00,
    default: 0 
  })
  hourlyRate: number;

  @Column({ name: 'shift_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  @ApiProperty({ 
    description: 'Tarifa por turno (8 horas) o por servicio completo', 
    example: 100.00,
    required: false 
  })
  shiftRate: number;

  @Column({ name: 'urgent_surcharge', type: 'decimal', precision: 5, scale: 2, nullable: true })
  @ApiProperty({ 
    description: 'Recargo por urgencia (porcentaje)', 
    example: 20.00,
    minimum: 0,
    maximum: 100,
    required: false 
  })
  urgentSurcharge: number;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ 
    description: 'Descripción del servicio', 
    example: 'Como enfermera con 10 años de experiencia geriátrica...',
    required: false 
  })
  description: string;

  @Column({ length: 50, nullable: true })
  @ApiProperty({ 
    description: 'Años de experiencia', 
    example: '5-10 años',
    required: false 
  })
  experience: string;

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({ 
    description: 'Disponibilidad específica para este servicio', 
    example: ['Mañanas', 'Tardes', 'Fines de semana'],
    type: [String],
    required: false 
  })
  availability: string[];

  @Column({ name: 'schedule_start', type: 'time', nullable: true })
  @ApiProperty({ 
    description: 'Hora de inicio del horario', 
    example: '08:00:00',
    required: false 
  })
  scheduleStart: string;

  @Column({ name: 'schedule_end', type: 'time', nullable: true })
  @ApiProperty({ 
    description: 'Hora de fin del horario', 
    example: '18:00:00',
    required: false 
  })
  scheduleEnd: string;

  @Column({ name: 'specific_dates', type: 'simple-array', nullable: true })
  @ApiProperty({ 
    description: 'Fechas específicas de disponibilidad (ISO format)', 
    example: ['2024-01-15', '2024-01-16'],
    type: [String],
    required: false 
  })
  specificDates: string[];

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ 
    description: 'Formación específica', 
    example: 'Máster en Geriatría, Curso de Alzheimer',
    required: false 
  })
  training: string;

  @Column({ name: 'medical_skills', type: 'simple-array', nullable: true })
  @ApiProperty({ 
    description: 'Habilidades médicas (para cuidado de mayores)', 
    example: ['Alzheimer', 'Parkinson', 'Diabetes'],
    type: [String],
    required: false 
  })
  medicalSkills: string[];

  // Pet Care specific attributes
  @Column({ name: 'accepted_pets', type: 'simple-array', nullable: true })
  @ApiProperty({ 
    description: 'Tipos de mascotas aceptadas', 
    example: ['Perros', 'Gatos'],
    type: [String],
    required: false 
  })
  acceptedPets: string[];

  @Column({ name: 'pet_work_zones', type: 'simple-array', nullable: true })
  @ApiProperty({ 
    description: 'Zonas de trabajo para mascotas', 
    example: ['A domicilio', 'En casa del cuidador'],
    type: [String],
    required: false 
  })
  petWorkZones: string[];

  @Column({ name: 'max_pets', nullable: true })
  @ApiProperty({ 
    description: 'Número máximo de mascotas', 
    example: 3,
    required: false 
  })
  maxPets: number;

  // Housekeeping specific attributes
  @Column({ name: 'cleaning_products', nullable: true })
  @ApiProperty({ 
    description: 'Quien proporciona los productos de limpieza', 
    enum: ['provider', 'client', 'flexible'],
    example: 'flexible',
    required: false 
  })
  cleaningProducts: string;

  @Column({ name: 'has_equipment', default: false })
  @ApiProperty({ 
    description: 'Indica si dispone de equipo propio', 
    example: true,
    default: false 
  })
  hasEquipment: boolean;

  @Column({ name: 'waste_management', default: false })
  @ApiProperty({ 
    description: 'Incluye gestión de residuos', 
    example: false,
    default: false 
  })
  wasteManagement: boolean;

  @Column({ name: 'eco_friendly', default: false })
  @ApiProperty({ 
    description: 'Usa productos ecológicos', 
    example: true,
    default: false 
  })
  ecoFriendly: boolean;

  @OneToMany(() => Certificate, (certificate) => certificate.serviceConfig, { cascade: true })
  @ApiProperty({ 
    description: 'Certificados asociados a este servicio',
    type: () => [Certificate]
  })
  certificates: Certificate[];

  @OneToMany(() => ServiceVariation, (variation) => variation.serviceConfig, { cascade: true })
  @ApiProperty({ 
    description: 'Variaciones de precio para este servicio',
    type: () => [ServiceVariation]
  })
  variations: ServiceVariation[];
}
