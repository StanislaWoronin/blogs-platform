import { IsEmail } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class EmailDto {
  @IsEmail()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  email: string;
}
