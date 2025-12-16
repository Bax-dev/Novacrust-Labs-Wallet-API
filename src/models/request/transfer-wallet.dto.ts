import { IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDecimal, IsValidAmount } from '../../utils/validators.util';

export class TransferWalletDto {
  @ApiProperty({
    description: 'UUID of the receiver wallet',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  receiverWalletId: string;

  @ApiProperty({
    description: 'Amount to transfer',
    example: 50.00,
    minimum: 0.01,
    maximum: 999999999.99,
    type: Number,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  @IsDecimal()
  @IsValidAmount()
  amount: number;
}

