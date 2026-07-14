import PaginationSchema from '../pagination/PaginationSchema'
import { IsIn, IsOptional, IsString } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class GetCategories extends PaginationSchema {

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
  @IsIn([ 'i', 'somebody' ])
  @Field({ nullable: true })
  public creator?: string
}