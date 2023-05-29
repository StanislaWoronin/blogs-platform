import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {Image} from "./image.entity";
import {ImageType} from "./imageType";
import {Posts} from "../public/posts/infrastructure/entity/posts.entity";

@Entity()
export class PostImage extends Image {
    @ManyToOne(() => Posts, (p) => p.images)
    @JoinColumn()
    post: Posts;
    @Column() postId: string;

    static create(
        imageId: string,
        postId: string,
        imageType: ImageType,
        url: string,
        width: number,
        height: number,
        fileSize: number,
    ) {

        return {
            imageId,
            postId,
            imageType,
            url,
            width,
            height,
            fileSize,
        };
    }
}