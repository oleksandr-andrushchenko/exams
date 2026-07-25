import { ArgsType, Field, Int } from 'type-graphql'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

@ArgsType()
export default class GetExamTags {
  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  public readonly search?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Field(_type => Int, { nullable: true, defaultValue: 20 })
  public readonly size?: number = 20
}
