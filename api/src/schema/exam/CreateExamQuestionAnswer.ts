import { IsNumber, IsOptional, Length, Min } from 'class-validator'
import { Field, InputType, Int } from 'type-graphql'

@InputType()
export default class CreateExamQuestionAnswer {

  @IsOptional()
  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Field(_type => Int, { nullable: true })
  public readonly choice?: number

  @IsOptional()
  @Length(2, 10)
  @Field({ nullable: true })
  public readonly answer?: string
}