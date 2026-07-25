import { ArrayMaxSize, ArrayUnique, IsArray, IsNumber, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator'
import { Field, InputType, Int } from 'type-graphql'

@InputType()
export default class CreateExam {

  @Length(3, 100)
  @Field()
  public readonly name: string

  @Min(0)
  @Max(100)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Field(_type => Int, { nullable: true, defaultValue: 0 })
  public readonly requiredScore?: number = 0

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 50, { each: true })
  @Matches(/\S/, { each: true })
  @Field(_type => [ String ], { nullable: true })
  public readonly tags?: string[] = []
}