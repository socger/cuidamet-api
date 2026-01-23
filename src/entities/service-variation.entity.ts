import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ServiceConfig } from './service-config.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entidad para variaciones de precios de servicios
 * Representa diferentes modalidades de cobro (por hora, por noche, por visita, etc.)
 */
@Entity('service_variations')
export class ServiceVariation extends BaseEntity {
  @ManyToOne(() => ServiceConfig, (serviceConfig) => serviceConfig.variations)
  @JoinColumn({ name: 'service_config_id' })
  @ApiProperty({ 
    description: 'Configuración de servicio asociada',
    type: () => ServiceConfig 
  })
  serviceConfig: ServiceConfig;

  @Column({ name: 'service_config_id' })
  @ApiProperty({ description: 'ID de la configuración de servicio', example: 1 })
  serviceConfigId: number;

  @Column({ length: 100 })
  @ApiProperty({ 
    description: 'Nombre de la variación', 
    example: 'Por hora' 
  })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({ 
    description: 'Precio de la variación', 
    example: 15.50,
    minimum: 0 
  })
  price: number;

  @Column({ length: 50 })
  @ApiProperty({ 
    description: 'Unidad de medida', 
    example: 'hora',
    enum: ['hora', 'noche', 'visita', 'paseo', 'servicio', 'm2', 'día']
  })
  unit: string;

  @Column({ default: true })
  @ApiProperty({ 
    description: 'Indica si la variación está activa', 
    example: true,
    default: true 
  })
  enabled: boolean;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ 
    description: 'Descripción de la variación', 
    example: 'Precio por hora de servicio durante días laborables',
    required: false 
  })
  description: string;

  @Column({ name: 'is_custom', default: false })
  @ApiProperty({ 
    description: 'Indica si es una variación personalizada creada por el usuario', 
    example: false,
    default: false 
  })
  isCustom: boolean;

  @Column({ name: 'display_order', default: 0 })
  @ApiProperty({ 
    description: 'Orden de visualización', 
    example: 1,
    default: 0 
  })
  displayOrder: number;
}
