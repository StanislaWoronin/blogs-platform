import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IQueryBlogsRepository } from '../modules/public/blogs/infrastructure/i-query-blogs.repository';

@Injectable()
export class ForbiddenGuard implements CanActivate {
  constructor(
    @Inject(IQueryBlogsRepository)
    protected queryBlogsRepository: IQueryBlogsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    let blogId = req.params.id;
    if (req.body.blogId) {
      blogId = req.body.blogId;
    }
    if (req.params.blogId) {
      blogId = req.params.blogId;
    }

    const bloggerId = await this.queryBlogsRepository.blogExist(blogId);

    if (!bloggerId) {
      throw new NotFoundException();
    }

    if (bloggerId !== req.user.id) {
      throw new ForbiddenException();
    }

    return true;
  }
}
