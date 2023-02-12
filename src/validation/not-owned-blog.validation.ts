import { ExecutionContext, Inject, PipeTransform } from '@nestjs/common';
import { PgQueryBlogsRepository } from '../modules/public/blogs/infrastructure/pg-query-blogs.repository';

export class NotOwnedBlogValidation implements PipeTransform {
  constructor(protected blogRepository: PgQueryBlogsRepository) {}

  async transform(context: ExecutionContext, metadata) {
    const req = context.switchToHttp().getRequest();

    const bloggerId = await this.blogRepository.getBlog(req.params.id);

    if (bloggerId !== null) {
      return false;
    }

    return true;
  }
}
