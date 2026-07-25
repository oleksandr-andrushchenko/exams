import { ArrayMaxSize, ArrayUnique, IsArray, IsNumber, IsString, Length, Matches, Max, Min, ValidateIf } from 'class-validator'
import { Field, InputType, Int } from 'type-graphql'

@InputType()
export default class UpdateExam {

  @ValidateIf(target => 'name' in target)
  @Length(3, 100)
  @Field({ nullable: true })
  public readonly name?: string

  @ValidateIf(target => 'requiredScore' in target)
  @Min(0)
  @Max(100)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Field(_type => Int, { nullable: true })
  public readonly requiredScore?: number

  @ValidateIf(target => 'tags' in target)
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 50, { each: true })
  @Matches(/\S/, { each: true })
  @Field(_type => [ String ], { nullable: true })
  public readonly tags?: string[]
}