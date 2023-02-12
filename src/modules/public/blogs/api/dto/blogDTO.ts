// import { IsString, IsUrl, Length } from 'class-validator';
// import { Transform, TransformFnParams } from 'class-transformer';
//
// export class BlogDto {
//   @IsString()
//   @Transform(({ value }: TransformFnParams) => value?.trim())
//   @Length(3, 15)
//   name: string;
//
//   @IsString()
//   @Transform(({ value }: TransformFnParams) => value?.trim())
//   @Length(3, 500)
//   description: string;
//
//   @IsString()
//   @Transform(({ value }: TransformFnParams) => value?.trim())
//   @Length(3, 100)
//   @IsUrl()
//   websiteUrl: string;
// }
