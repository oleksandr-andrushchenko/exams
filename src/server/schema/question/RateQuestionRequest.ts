import { IsNumber, Max, Min } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'
import GetQuestion from './GetQuestion'

@ArgsType()
export default class RateQuestionRequest extends GetQuestion {

  @Min(1)
  @Max(5)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Field(_type => Int)
  public readonly mark: number
}