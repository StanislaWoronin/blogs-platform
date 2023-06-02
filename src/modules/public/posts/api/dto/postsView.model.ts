import { NewestLikesModel } from '../../../likes/infrastructure/entity/newestLikes.model';
import {PostImage} from "../../../../blogger/post-image.entity";
import {PostImagesInfo} from "../../../../blogger/api/views/post-images-info.view";

export class PostViewModel {
  constructor(
    public id: string,
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
    public blogName: string,
    public createdAt: string,
    public extendedLikesInfo: {
      myStatus: string;
      likesCount: number;
      dislikesCount: number;
      newestLikes: NewestLikesModel[];
    },
    public images: PostImagesInfo
  ) {}
}

export class PostForBlogViewModel {
  constructor(
    public id: string,
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
    public blogName: string,
  ) {}
}
