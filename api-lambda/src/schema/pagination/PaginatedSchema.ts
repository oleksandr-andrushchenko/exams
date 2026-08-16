import { Type } from 'class-transformer'
import { IsIn, IsNumber, IsOptional, IsString, IsUrl, Max, Min, ValidateNested } from 'class-validator'

export class PaginatedMetaSchema {
  @IsOptional()
  @IsString()
  public prevCursor?: string

  @IsOptional()
  @IsUrl()
  public prevUrl?: string

  @IsOptional()
  @IsString()
  public nextCursor?: string

  @IsOptional()
  @IsUrl()
  public nextUrl?: string

  @IsIn(['id', 'createdAt', 'updatedAt'])
  public cursor: string = 'id'

  @Min(1)
  @Max(50)
  @IsNumber({ maxDecimalPlaces: 0 })
  public size: number = 10

  @IsIn(['asc', 'desc'])
  public order: 'asc' | 'desc' = 'desc'
}

export default class PaginatedSchema<Entity> {
  @ValidateNested({ each: true })
  public data: Entity[]

  @ValidateNested()
  @Type(() => PaginatedMetaSchema)
  public meta: PaginatedMetaSchema
}
