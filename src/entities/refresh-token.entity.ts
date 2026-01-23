import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Column({ length: 500 })
  token: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'is_revoked', default: false })
  isRevoked: boolean;

  @Column({ name: 'device_info', nullable: true, length: 255 })
  deviceInfo?: string;

  @Column({ name: 'ip_address', nullable: true, length: 45 })
  ipAddress?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
