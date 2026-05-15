import {
  IsString,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  initiator: string;

  @IsString()
  @IsNotEmpty()
  counterparty: string;

  @IsString()
  @IsNotEmpty()
  tokenA: string;

  @IsString()
  @IsNotEmpty()
  tokenB: string;

  @IsNumberString()
  amountA: string;

  @IsNumberString()
  amountB: string;

  @IsNumberString()
  timelock: number;

  @IsString()
  @IsOptional()
  secret?: string;
}
