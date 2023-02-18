import { PostDBModel } from "./entity/post-db.model";
import { CreatedPostModel } from "./entity/db-post.model";
import { PostDto } from "../../../blogger/api/dto/post.dto";

export interface IPostsRepository {
  createPost(newPost: PostDBModel): Promise<CreatedPostModel>
  updatePost(postId: string, dto: PostDto): Promise<boolean>
  deletePost(postId: string): Promise<boolean>
}

export const IPostsRepository = 'IPostsRepository'