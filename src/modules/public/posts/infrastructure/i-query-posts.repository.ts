import { QueryParametersDto } from '../../../../global-model/query-parameters.dto';
import { ContentPageModel } from '../../../../global-model/contentPage.model';
import { PostViewModel } from '../api/dto/postsView.model';

export interface IQueryPostsRepository {
  getPosts(
    queryDto: QueryParametersDto,
    blogId: string | undefined,
    userId: string | undefined,
  ): Promise<ContentPageModel>;
  getPostById(
    id: string,
    userId: string | undefined,
  ): Promise<PostViewModel | null>;
  getPostsForBlog(
    queryDto: QueryParametersDto,
    blogId: string,
  ): Promise<ContentPageModel>;
  getAllPostsId(blogId: string): Promise<{ id: string }[]>;
  postExist(id: string): Promise<boolean>;
  getBlogIdByCommentId(commentId: string): Promise<string>;
  getBlogIdByPostId(postId: string): Promise<string>;
}

export const IQueryPostsRepository = 'IQueryPostsRepository';
