import { IsBoolean, IsString, IsUUID, MinLength } from "class-validator";

export class BanUserDto {
  @IsString()
  @IsUUID() // TODO не отрабатывает
  blogId: string;

  @IsString()
  @MinLength(20)
  banReason: string; // по свагеру поле обязательно должно приходить, даже если пользователь разбанивается

  @IsBoolean()
  isBanned: boolean;
}
