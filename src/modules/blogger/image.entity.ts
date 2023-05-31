import {Column, PrimaryColumn} from "typeorm";
import {ImageType} from "./imageType";

export class Image {
    @PrimaryColumn()
    imageId: string;

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
}
