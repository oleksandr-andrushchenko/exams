import { IsIn, IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'

export default class PaginationSchema {
  @IsOptional()
  @IsString()
  @IsMongoId()
  public readonly prevCursor?: string

  @IsOptional()
  @IsString()
  @IsMongoId()
  public readonly nextCursor?: string

  @IsOptional()
  @IsIn(['id', 'createdAt', 'updatedAt'])
  public readonly cursor?: string = 'id'

  @IsOptional()
  @Min(1)
  @Max(50)
  @IsNumber({ maxDecimalPlaces: 0 })
  public readonly size?: number = 20

  @IsOptional()
  @IsIn(['asc', 'desc'])
  public readonly order?: 'asc' | 'desc' = 'desc'
}
