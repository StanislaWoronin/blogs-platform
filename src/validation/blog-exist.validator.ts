import { Inject, Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PgQueryBlogsRepository } from '../modules/public/blogs/infrastructure/pg-repository/pg-query-blogs.repository';
import { IQueryBlogsRepository } from '../modules/public/blogs/infrastructure/i-query-blogs.repository';

@ValidatorConstraint({ name: 'BlogExists', async: true })
@Injectable()
export class BlogExistValidator implements ValidatorConstraintInterface {
  constructor(
    @Inject(IQueryBlogsRepository)
    protected queryBlogsRepository: PgQueryBlogsRepository,
  ) {}

  async validate(blogId: string) {
    try {
      const blog = await this.queryBlogsRepository.blogExist(blogId);
      if (!blog) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return "Blog doesn't exist";
  }
}
