import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Users } from './users';

@Entity()
export class EmailConfirmation {
  @Column({ default: null }) confirmationCode: string | null;

  @Column({ default: null }) expirationDate: string | null;

  @Column({ default: false }) isConfirmed: boolean;

  @OneToOne(() => Users, (u) => u.emailConfirmation)
  @JoinColumn()
  user: Users;
  @PrimaryColumn() userId: string;
}
