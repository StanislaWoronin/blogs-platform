import {Column, Entity, JoinColumn, OneToOne, PrimaryColumn} from "typeorm";
import {Posts} from "../../../public/posts/infrastructure/entity/posts.entity";

@Entity()
export class BannedPost {
    @OneToOne(() => Posts, p => p.banStatus)
    @JoinColumn()
    post: Posts;
    @PrimaryColumn('uuid')
    postId: string;

    @Column()
    banDate: string;

    @Column()
    banReason: string;
}


