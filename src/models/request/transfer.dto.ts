import { IsUUID, IsNumber, IsPositive, IsNotEmpty } from 'class-validator';

export class TransferDto {
  @IsNotEmpty()
  @IsUUID()
  toWalletId: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;
}

