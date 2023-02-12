import { NewestLikesModel } from '../../../likes/infrastructure/entity/newestLikes.model';

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
  ) {}
}

export class PostForBlogViewModel {
    constructor(
        public id: string,
        public title: string,
        public shortDescription: string,
        public content: string,
        public blogId: string,
        public blogName: string
    ) {}
}
