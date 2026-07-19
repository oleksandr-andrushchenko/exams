import PaginationSchema from '../pagination/PaginationSchema'
import { IsIn, IsOptional, IsString, Matches } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class GetExams extends PaginationSchema {

  @IsOptional()
  @IsIn([ 'yes', 'no' ])
  @Field({ nullable: true })
  public readonly subscription?: string

  @IsOptional()
  @IsIn([ 'yes', 'no' ])
  @Field({ nullable: true })
  public readonly approved?: string

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  public readonly search?: string

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @Field({ nullable: true })
  public readonly tag?: string

  @IsOptional()
  @IsIn([ 'i', 'somebody' ])
  @Field({ nullable: true })
  public creator?: string
}