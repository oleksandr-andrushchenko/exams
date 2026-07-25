import { IsIn, IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export default class PaginationSchema {

  @IsOptional()
  @IsString()
  @IsMongoId()
  @Field({ nullable: true })
  public readonly prevCursor?: string

  @IsOptional()
  @IsString()
  @IsMongoId()
  @Field({ nullable: true })
  public readonly nextCursor?: string

  @IsOptional()
  @IsIn([ 'id', 'createdAt', 'updatedAt' ])
  @Field({ nullable: true })
  public readonly cursor?: string = 'id'

  @IsOptional()
  @Min(1)
  @Max(50)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Field(_type => Int, { nullable: true })
  public readonly size?: number = 20

  @IsOptional()
  @IsIn([ 'asc', 'desc' ])
  @Field({ nullable: true })
  public readonly order?: 'asc' | 'desc' = 'desc'
}