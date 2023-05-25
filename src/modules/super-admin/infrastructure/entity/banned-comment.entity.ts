import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Comments } from '../../../public/comments/infrastructure/entity/comments.entity';

@Entity()
export class BannedComment {
  @OneToOne(() => Comments, (c) => c.banStatus)
  @JoinColumn()
  comment: Comments;
  @PrimaryColumn('uuid')
  commentId: string;

  @Column()
  banDate: string;

  @Column()
  banReason: string;
}
