import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PgQueryBlogsRepository } from '../modules/public/blogs/infrastructure/pg-query-blogs.repository';

@Injectable()
export class ForbiddenGuard implements CanActivate {
  constructor(protected blogsRepository: PgQueryBlogsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    let blogId = req.params.id;
    if (req.body.blogId) {
      blogId = req.body.blogId;
    }
    if (req.params.blogId) {
      blogId = req.params.blogId;
    }

    const bloggerId = await this.blogsRepository.blogExist(blogId);

    if (!bloggerId) {
      throw new NotFoundException();
    }

    if (bloggerId !== req.user.id) {
      throw new ForbiddenException();
    }

    return true;
  }
}
