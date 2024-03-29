import { QueryParametersDto } from '../../../../global-model/query-parameters.dto';
import { ContentPageModel } from '../../../../global-model/contentPage.model';
import { BlogViewModelWithBanStatus } from '../api/dto/blogView.model';

export interface IQueryBlogsRepository {
  getBlogs(
    queryDto: QueryParametersDto,
    userId?: string,
  ): Promise<ContentPageModel>;
  saGetBlogs(queryDto: QueryParametersDto): Promise<ContentPageModel>;
  getBlog(blogId: string, userId?: string);
  blogExist(blogId: string): Promise<string | null>;
  blogBanned(blogId: string): Promise<boolean | null>;
  getBlogName(blogId: string): Promise<string | null>;
}

export const IQueryBlogsRepository = 'IQueryBlogsRepository';
