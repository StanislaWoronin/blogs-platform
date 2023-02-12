import { Injectable } from '@nestjs/common';
import { BlogDto } from '../../../blogger/api/dto/blog.dto';
import { BindBlogDto } from '../../../super-admin/api/dto/bind-blog.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BlogDBModel } from './entity/blog-db.model';
import { BlogViewModel } from '../api/dto/blogView.model';

@Injectable()
export class PgBlogsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createBlog(newBlog: BlogDBModel): Promise<BlogViewModel | null> {
    const query = `
      INSERT INTO public.blogs
             (id, name, description, "websiteUrl", "createdAt", "userId", "isMembership")
      VAlUES ($1, $2, $3, $4, $5, $6, $7)  
             RETURNING id, name, description, "websiteUrl", "createdAt", "isMembership"
    `;
    const result = await this.dataSource.query(query, [
      newBlog.id,
      newBlog.name,
      newBlog.description,
      newBlog.websiteUrl,
      newBlog.createdAt,
      newBlog.userId,
      newBlog.isMembership
    ]);

    return result[0];
  }

  async bindBlog(params: BindBlogDto): Promise<boolean> {
    const query = `
      UPDATE public.blogs
         SET "userId" = $1
       WHERE id = $2
    `;
    const result = await this.dataSource.query(query, [
      params.userId,
      params.id,
    ]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  async updateBlog(id: string, dto: BlogDto): Promise<boolean> {
    const query = `
      UPDATE public.blogs
         SET name = $1, description = $2, "websiteUrl" = $3
       WHERE id = $4
    `;
    const result = await this.dataSource.query(query, [
      dto.name,
      dto.description,
      dto.websiteUrl,
      id,
    ]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }

  async deleteBlog(blogId: string): Promise<boolean> {
    const query = `
      DELETE FROM public.blogs
       WHERE id = $1;
    `;
    const result = await this.dataSource.query(query, [blogId]);

    if (result[1] !== 1) {
      return false;
    }
    return true;
  }
}
