import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SwapStatus {
  Created = 'created',
  Funded = 'funded',
  Completed = 'completed',
  Refunded = 'refunded',
  Expired = 'expired',
}

@Entity({ name: 'swaps' })
export class SwapOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  swapId: string;

  @Column()
  initiator: string;

  @Column()
  counterparty: string;

  @Column()
  tokenA: string;

  @Column()
  tokenB: string;

  @Column('numeric')
  amountA: string;

  @Column('numeric')
  amountB: string;

  @Column()
  hashlock: string;

  @Column('bigint')
  timelock: number;

  @Column({ type: 'enum', enum: SwapStatus, default: SwapStatus.Created })
  status: SwapStatus;

  @Column({ nullable: true })
  secret?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
