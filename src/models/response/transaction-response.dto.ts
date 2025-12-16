import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty({
    description: 'Transaction UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Wallet UUID associated with this transaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  walletId: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: ['FUND', 'TRANSFER_OUT', 'TRANSFER_IN'],
    example: 'FUND',
  })
  type: string;

  @ApiProperty({
    description: 'Transaction amount',
    example: 100.50,
  })
  amount: number;

  @ApiProperty({
    description: 'Related wallet UUID (for transfers)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  relatedWalletId?: string;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Fund wallet with 100.5 USD',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Transaction creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}
