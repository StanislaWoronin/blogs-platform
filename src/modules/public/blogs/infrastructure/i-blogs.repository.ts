import { BlogDBModel } from './entity/blog-db.model';
import { CreatedBlogModel } from '../api/dto/blogView.model';
import { BindBlogDto } from '../../../super-admin/api/dto/bind-blog.dto';
import { BlogDto } from '../../../blogger/api/dto/blog.dto';

export interface IBlogsRepository {
  createBlog(newBlog: BlogDBModel): Promise<CreatedBlogModel | null>;
  bindBlog(params: BindBlogDto): Promise<boolean>;
  updateBlog(id: string, dto: BlogDto): Promise<boolean>;
  deleteBlog(blogId: string): Promise<boolean>;
}

export const IBlogsRepository = 'IBlogsRepository';
