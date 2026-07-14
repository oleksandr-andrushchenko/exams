import { Type } from 'class-transformer'
import { IsIn, IsNumber, IsOptional, IsString, IsUrl, Max, Min, ValidateNested } from 'class-validator'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class PaginatedMetaSchema {

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  public prevCursor?: string

  @IsOptional()
  @IsUrl()
  @Field({ nullable: true })
  public prevUrl?: string

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  public nextCursor?: string

  @IsOptional()
  @IsUrl()
  @Field({ nullable: true })
  public nextUrl?: string

  @IsIn([ 'id', 'createdAt', 'updatedAt' ])
  @Field()
  public cursor: string = 'id'

  @Min(1)
  @Max(50)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Field(_type => Int)
  public size: number = 10

  @IsIn([ 'asc', 'desc' ])
  @Field()
  public order: 'asc' | 'desc' = 'desc'
}

@ObjectType()
export default class PaginatedSchema<Entity> {

  @ValidateNested({ each: true })
  public data: Entity[]

  @ValidateNested()
  @Type(() => PaginatedMetaSchema)
  @Field(_type => PaginatedMetaSchema)
  public meta: PaginatedMetaSchema
}