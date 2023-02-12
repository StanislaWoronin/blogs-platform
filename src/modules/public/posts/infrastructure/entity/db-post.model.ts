import { NewestLikesModel } from '../../../likes/infrastructure/entity/newestLikes.model';

export class DbPostModel {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  createdAt: string;
  blogId: string;
  blogName: string;
  likesCount: number;
  dislikesCount: number;
  login: string;
  newestLikes: NewestLikesModel[];
  myStatus?: string;
}

export class CreatedPostModel {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  createdAt: string;
  blogId: string;
  blogName: string;
}