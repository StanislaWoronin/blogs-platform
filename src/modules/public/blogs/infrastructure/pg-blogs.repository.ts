import { Injectable } from '@nestjs/common';
import { BlogDto } from '../../../blogger/api/dto/blog.dto';
import { BindBlogDto } from '../../../super-admin/api/dto/bind-blog.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BlogDBModel } from './entity/blog-db.model';
import { CreatedBlogModel } from '../api/dto/blogView.model';
import {Blogs} from "./entity/blogs.entity";

@Injectable()
export class PgBlogsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createBlog(newBlog: BlogDBModel): Promise<CreatedBlogModel | null> {
    const result = await this.dataSource.getRepository("blogs")
        .createQueryBuilder()
        .insert()
        .into(Blogs)
        .values([{
          id: newBlog.id,
          name: newBlog.name,
          description: newBlog.description,
          websiteUrl: newBlog.websiteUrl,
          createdAt: newBlog.createdAt,
          userId: newBlog.userId,
          isMembership: newBlog.isMembership
        }])
        .returning("id, name, description, \"websiteUrl\", \"createdAt\", \"isMembership\"")
        .execute()

    return result.raw[0]
  }

  async bindBlog(params: BindBlogDto): Promise<boolean> {
    const result = await this.dataSource.getRepository("blogs")
        .createQueryBuilder()
        .update(Blogs)
        .set({
          userId: params.userId
        })
        .where("id = :id", { id: params.id })
        .execute()

    if (result.affected !== 1) {
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
    const result = await this.dataSource.getRepository("blogs")
        .createQueryBuilder()
        .update(Blogs)
        .set({
          name: dto.name,
          description: dto.description,
          websiteUrl: dto.websiteUrl
        })
        .where("id = :id", { id: id })
        .execute()

    if (result.affected !== 1) {
      return false;
    }
    return true;
  }

  async deleteBlog(blogId: string): Promise<boolean> {
    const result = await this.dataSource.getRepository("blogs")
        .createQueryBuilder()
        .delete()
        .from(Blogs)
        .where("id = :id", { id: blogId })
        .execute()

    if (result.affected !== 1) {
      return false;
    }
    return true;
  }
}
