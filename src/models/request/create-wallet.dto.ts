import { IsOptional, IsString, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsCurrency, IsDecimal, IsValidAmount } from '../../utils/validators.util';

export class CreateWalletDto {
  @ApiProperty({
    description: 'Currency code (defaults to USD)',
    example: 'USD',
    required: false,
    enum: ['USD'],
  })
  @IsOptional()
  @IsString()
  @IsCurrency()
  currency?: string;

  @ApiProperty({
    description: 'Initial balance for the wallet (defaults to 0)',
    example: 100.50,
    required: false,
    minimum: 0,
    maximum: 999999999.99,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0)
  @IsDecimal()
  @IsValidAmount()
  balance?: number;
}
