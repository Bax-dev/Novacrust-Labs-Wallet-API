import { IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsDecimal, IsValidAmount } from '../../utils/validators.util';

export class FundWalletDto {
  @ApiProperty({
    description: 'Amount to fund the wallet',
    example: 100.50,
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
