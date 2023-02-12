import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TokenBlackList {
  @PrimaryGeneratedColumn() id: number;
  @Column() token: string;
}
