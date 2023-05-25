import { ExecutionContext, Inject, PipeTransform } from '@nestjs/common';
import { PgQueryBlogsRepository } from '../modules/public/blogs/infrastructure/pg-repository/pg-query-blogs.repository';
import { IQueryBlogsRepository } from '../modules/public/blogs/infrastructure/i-query-blogs.repository';

export class NotOwnedBlogValidation implements PipeTransform {
  constructor(
    @Inject(IQueryBlogsRepository)
    protected queryBlogsRepository: PgQueryBlogsRepository,
  ) {}

  async transform(context: ExecutionContext, metadata) {
    const req = context.switchToHttp().getRequest();

    const bloggerId = await this.queryBlogsRepository.getBlog(req.params.id);

    if (bloggerId !== null) {
      return false;
    }

    return true;
  }
}
