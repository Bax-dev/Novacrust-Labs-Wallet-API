import { ApiProperty } from '@nestjs/swagger';
import { TransactionResponseDto } from './transaction-response.dto';

export class WalletResponseDto {
  @ApiProperty({
    description: 'Wallet UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Current wallet balance',
    example: 100.50,
  })
  balance: number;

  @ApiProperty({
    description: 'Wallet creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Wallet last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Transaction history',
    type: [TransactionResponseDto],
    required: false,
  })
  transactions?: TransactionResponseDto[];
}

