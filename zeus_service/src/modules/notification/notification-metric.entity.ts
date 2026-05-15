import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('notification_metrics')
export class NotificationMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  notificationId: string;

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: false })
  delivered: boolean;

  @Column({ type: 'json', nullable: true })
  lastResult: any;

  @CreateDateColumn()
  createdAt: Date;
}
