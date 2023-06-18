import { Inject, Injectable } from '@nestjs/common';
import { BlogViewModel } from '../api/dto/blogView.model';
import { BlogDto } from '../../../blogger/api/dto/blog.dto';
import { BlogDBModel } from '../infrastructure/entity/blog-db.model';
import { v4 as uuidv4 } from 'uuid';
import { IBlogsRepository } from '../infrastructure/i-blogs.repository';
import { SubscriptionStatus } from '../../../integrations/subscription-status.enum';

@Injectable()
export class BlogsService {
  constructor(
    @Inject(IBlogsRepository) protected blogsRepository: IBlogsRepository,
  ) {}

  async createBlog(userId: string, inputModel: BlogDto) {
    const newBlog = new BlogDBModel(
      uuidv4(),
      inputModel.name,
      inputModel.description,
      inputModel.websiteUrl,
      new Date().toISOString(),
      userId,
      false,
    );
    const blog = await this.blogsRepository.createBlog(newBlog);
    return {
      id: blog.id,
      name: blog.name,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
      images: blog.images,
      currentUserSubscriptionStatus: SubscriptionStatus.None,
      subscribersCount: 0,
    };
  }

  async updateBlog(blogId: string, dto: BlogDto): Promise<boolean> {
    return await this.blogsRepository.updateBlog(blogId, dto);
  }

  async deleteBlog(blogId: string): Promise<boolean> {
    return await this.blogsRepository.deleteBlog(blogId);
  }
}
