import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { SortDirections, SortParametersModel } from './sort-parameters.model';
import { BanStatusModel } from './ban-status.model';

export class QueryParametersDto {
  @IsEnum(BanStatusModel)
  @IsOptional()
  banStatus: string = BanStatusModel.All;

  @IsEnum(SortParametersModel)
  @IsOptional()
  sortBy: string = SortParametersModel.CreatedAt;

  @IsEnum(SortDirections)
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return;
    switch (value) {
      case 'asc':
        return (value = SortDirections.Ascending);
      default:
        return SortDirections.Distending;
    }
  })
  sortDirection: string = SortDirections.Distending;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsOptional()
  pageNumber = 1;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsOptional()
  pageSize = 10;

  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  @IsOptional()
  searchNameTerm = '';

  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  @IsOptional()
  searchLoginTerm = '';

  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  @IsOptional()
  searchEmailTerm = '';
}
