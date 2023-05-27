import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../super-admin/infrastructure/entity/users.entity';
import { ImageType } from './imageType';

@Entity()
export class Image {
  @PrimaryGeneratedColumn('uuid')
  imageId: string;

  @ManyToOne(() => Users, (u) => u.images)
  @JoinColumn()
  user: Users;
  @Column() userId: string;

  @Column()
  imageType: ImageType;

  @Column()
  url: string;

  @Column()
  width: number;

  @Column()
  height: number;

  @Column()
  fileSize: number;

  static create(
    userId: string,
    url: string,
    width: number,
    height: number,
    size: number,
  ) {
    return {
      userId,
      url,
      width,
      height,
      size,
    };
  }
}
