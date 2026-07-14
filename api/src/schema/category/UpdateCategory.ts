import { IsNumber, Length, Max, Min, ValidateIf } from 'class-validator'
import { Field, InputType, Int } from 'type-graphql'

@InputType()
export default class UpdateCategory {

  @ValidateIf(target => 'name' in target)
  @Length(3, 30)
  @Field({ nullable: true })
  public readonly name?: string

  @ValidateIf(target => 'requiredScore' in target)
  @Min(0)
  @Max(100)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Field(_type => Int, { nullable: true })
  public readonly requiredScore?: number
}