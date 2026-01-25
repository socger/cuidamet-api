import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfilesResponseDto {
  @ApiPropertyOptional({
    description: 'Perfil de cliente del usuario (si existe)',
  })
  clientProfile?: any | null;

  @ApiPropertyOptional({
    description: 'Perfil de proveedor del usuario (si existe)',
  })
  providerProfile?: any | null;

  @ApiProperty({
    description: 'Indica si el usuario tiene algún perfil creado',
    example: true,
  })
  hasProfiles: boolean;

  @ApiProperty({
    description: 'Tipo de perfil que tiene el usuario',
    example: 'client',
    enum: ['none', 'client', 'provider', 'both'],
  })
  profileType: 'none' | 'client' | 'provider' | 'both';
}
