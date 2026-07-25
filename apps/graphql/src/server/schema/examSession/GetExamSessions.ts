import PaginationSchema from '../pagination/PaginationSchema'
import { IsBoolean, IsMongoId, IsOptional } from 'class-validator'
import { ArgsType, Field, ID } from 'type-graphql'

@ArgsType()
export default class GetExamSessions extends PaginationSchema {

  @IsOptional()
  @IsMongoId()
  @Field(_type => ID, { nullable: true })
  public readonly userId?: string

  @IsOptional()
  @IsMongoId()
  @Field(_type => ID, { nullable: true })
  public readonly examId?: string

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  public readonly completion?: boolean
}
