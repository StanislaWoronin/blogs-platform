import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../../../super-admin/infrastructure/entity/users.entity';

@Entity()
export class TelegramBotSubscriptions {
  @PrimaryGeneratedColumn('uuid')
  authorizationCode: string;

  @ManyToOne(() => Users, (u) => u.telegramBots)
  @JoinColumn()
  user: Users;
  @Column() userId: string;

  @Column({ nullable: true })
  telegramId: number;

  @Column()
  createdAt: string = new Date().toISOString();

  static create(userId: string) {
    const newUser = new TelegramBotSubscriptions();
    newUser.userId = userId;

    return newUser;
  }
}
