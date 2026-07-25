import { IsNumber, Max, Min } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'
import GetExam from './GetExam'

@ArgsType()
export default class RateExamRequest extends GetExam {

  @Min(1)
  @Max(5)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Field(_type => Int)
  public readonly mark: number
}