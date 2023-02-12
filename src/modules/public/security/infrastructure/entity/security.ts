import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Users } from '../../../../super-admin/infrastructure/entity/users';

@Entity()
export class Security {
  @PrimaryColumn('uuid') deviceId: string;

  @Column() deviceTitle: string;

  @Column() ipAddress: string;

  @Column() iat: string;

  @Column() exp: string;

  @ManyToOne(() => Users, (u) => u.security)
  @JoinColumn()
  user: Users;
  @Column() userId: string;
}
