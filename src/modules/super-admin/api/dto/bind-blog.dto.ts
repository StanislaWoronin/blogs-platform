import { IsString, Validate } from 'class-validator';
import { NotOwnedBlogValidation } from '../../../../validation/not-owned-blog.validation';

export class BindBlogDto {
  @IsString()
  @Validate(NotOwnedBlogValidation)
  id: string;

  @IsString()
  userId: string;
}
