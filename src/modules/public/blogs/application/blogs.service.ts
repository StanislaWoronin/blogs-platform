import { Injectable } from '@nestjs/common';
import { BlogViewModel } from '../api/dto/blogView.model';
import { BlogDto } from '../../../blogger/api/dto/blog.dto';
import { BlogDBModel } from '../infrastructure/entity/blog-db.model';
import { v4 as uuidv4 } from 'uuid';
import { PgBlogsRepository } from '../infrastructure/pg-blogs.repository';

@Injectable()
export class BlogsService {
  constructor(protected blogsRepository: PgBlogsRepository) {}

  async createBlog(
    userId: string,
    inputModel: BlogDto,
  ): Promise<BlogViewModel | null> {
    const newBlog = new BlogDBModel(
      uuidv4(),
      inputModel.name,
      inputModel.description,
      inputModel.websiteUrl,
      new Date().toISOString(),
      userId,
      false
    );

    return await this.blogsRepository.createBlog(newBlog);
  }

  async updateBlog(blogId: string, dto: BlogDto): Promise<boolean> {
    return await this.blogsRepository.updateBlog(blogId, dto);
  }

  async deleteBlog(blogId: string): Promise<boolean> {
    return await this.blogsRepository.deleteBlog(blogId);
  }
}
