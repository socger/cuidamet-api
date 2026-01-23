import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidad que almacena los intentos de login (exitosos y fallidos)
 * para implementar throttling y prevenir ataques de fuerza bruta
 */
@Entity('login_attempts')
@Index('idx_ip_created', ['ipAddress', 'createdAt'])
@Index('idx_identifier_created', ['identifier', 'createdAt'])
export class LoginAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Identificador del intento (puede ser email o username)
   */
  @Column({ length: 100 })
  identifier: string;

  /**
   * Dirección IP desde donde se realizó el intento
   */
  @Column({ name: 'ip_address', length: 45 })
  ipAddress: string;

  /**
   * User Agent del navegador/cliente
   */
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  /**
   * Indica si el intento fue exitoso o fallido
   */
  @Column({ name: 'is_successful', default: false })
  isSuccessful: boolean;

  /**
   * Mensaje de error si el intento falló
   */
  @Column({
    name: 'failure_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  failureReason: string;

  /**
   * Fecha y hora del intento
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Tiempo hasta que expira el bloqueo (si aplica)
   */
  @Column({ name: 'blocked_until', type: 'datetime', nullable: true })
  blockedUntil: Date;
}
