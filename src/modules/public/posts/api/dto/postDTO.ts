import { IsNotEmpty, IsString, Length, Validate } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { BlogExistValidator } from '../../../../../validation/blog-exist.validator';

export class PostDTO {
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @Length(3, 30)
  title: string;

  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @Length(3, 100)
  shortDescription: string;

  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @Length(3, 1000)
  content: string;
}

export class PostWithBlogIdDTO {
  @IsString()
  @Transform(({ value }: TransformFnParams) => value.trim())
  @Length(3, 30)
  title: string;

  @IsString()
  @Transform(({ value }: TransformFnParams) => value.trim())
  @Length(3, 100)
  shortDescription: string;

  @IsString()
  @Transform(({ value }: TransformFnParams) => value.trim())
  @Length(3, 1000)
  content: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @Validate(BlogExistValidator)
  blogId: string;
}
