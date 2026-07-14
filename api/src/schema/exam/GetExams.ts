import PaginationSchema from '../pagination/PaginationSchema'
import { IsBoolean, IsMongoId, IsOptional } from 'class-validator'
import { ArgsType, Field, ID } from 'type-graphql'

@ArgsType()
export default class GetExams extends PaginationSchema {

  @IsOptional()
  @IsMongoId()
  @Field(_type => ID, { nullable: true })
  public readonly categoryId?: string

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  public readonly completion?: boolean
}