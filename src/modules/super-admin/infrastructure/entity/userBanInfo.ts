import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Users } from './users';

@Entity()
export class UserBanInfo {
  @Column({ default: false }) banStatus: boolean;

  @Column({ default: null }) banDate: string | null;

  @Column({ default: null }) banReason: string | null;

  @OneToOne(() => Users, (u) => u.banInfo)
  @JoinColumn()
  user: Users;
  @PrimaryColumn() userId: string;
}
