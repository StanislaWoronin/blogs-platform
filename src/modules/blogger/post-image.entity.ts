import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {Image} from "./image.entity";
import {ImageType} from "./imageType";
import {Posts} from "../public/posts/infrastructure/entity/posts.entity";
import {randomUUID} from "crypto";

@Entity()
export class PostImage extends Image {
    @ManyToOne(() => Posts, (p) => p.images)
    @JoinColumn()
    post: Posts;
    @Column() postId: string;

    static create(
        postId: string,
        imageType: ImageType,
        width: number,
        height: number,
        fileSize: number,
        userId: string,
        blogId: string,
        originalName: string
    ) {

        return {
            imageId: randomUUID(),
            postId,
            blogId,
            imageType,
            url: `content/users/${userId}/${blogId}/${postId}/${imageType}/${originalName}`,
            width,
            height,
            fileSize,
        };
    }
}