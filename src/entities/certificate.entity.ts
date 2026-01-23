import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ServiceConfig } from './service-config.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entidad para certificados, referencias y documentos de verificación
 */
@Entity('certificates')
export class Certificate extends BaseEntity {
  @ManyToOne(() => ServiceConfig, (serviceConfig) => serviceConfig.certificates)
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
    description: 'Nombre de la institución o referencia', 
    example: 'Hospital General de Madrid' 
  })
  name: string;

  @Column({ name: 'contact_info', length: 255, nullable: true })
  @ApiProperty({ 
    description: 'Información de contacto (privada)', 
    example: '+34612345678 o contact@hospital.com',
    required: false 
  })
  contactInfo: string;

  @Column({ type: 'text' })
  @ApiProperty({ 
    description: 'Descripción del certificado', 
    example: 'Certificado de enfermería especializada en geriatría' 
  })
  description: string;

  @Column({ name: 'certificate_type' })
  @ApiProperty({ 
    description: 'Tipo de certificado', 
    enum: ['experience', 'education', 'license', 'other'],
    example: 'education'
  })
  certificateType: string;

  @Column({ name: 'file_name', length: 255, nullable: true })
  @ApiProperty({ 
    description: 'Nombre del archivo subido', 
    example: 'certificado_enfermeria.pdf',
    required: false 
  })
  fileName: string;

  @Column({ name: 'file_url', length: 500, nullable: true })
  @ApiProperty({ 
    description: 'URL segura del archivo', 
    example: 'https://storage.example.com/certificates/abc123.pdf',
    required: false 
  })
  fileUrl: string;

  @Column({ name: 'verification_status', default: 'pending' })
  @ApiProperty({ 
    description: 'Estado de verificación', 
    enum: ['pending', 'verified', 'rejected'],
    example: 'verified',
    default: 'pending'
  })
  verificationStatus: string;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  @ApiProperty({ 
    description: 'Fecha de verificación', 
    example: '2024-01-15T10:30:00Z',
    required: false 
  })
  verifiedAt: Date;

  @Column({ name: 'verified_by', nullable: true })
  @ApiProperty({ 
    description: 'ID del usuario que verificó', 
    example: 42,
    required: false 
  })
  verifiedBy: number;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  @ApiProperty({ 
    description: 'Razón del rechazo (si aplica)', 
    example: 'Documento ilegible o incompleto',
    required: false 
  })
  rejectionReason: string;
}
