import {
  IsString,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { BlockchainType } from '../models/swap-order.model';

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

  @IsOptional()
  @IsEnum(BlockchainType)
  blockchain?: BlockchainType;
}
