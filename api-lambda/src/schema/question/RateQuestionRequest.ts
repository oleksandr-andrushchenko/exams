import { IsNumber, Max, Min } from 'class-validator'
import GetQuestion from './GetQuestion'

export default class RateQuestionRequest extends GetQuestion {
  @Min(0)
  @Max(5)
  @IsNumber({ maxDecimalPlaces: 0 })
  public readonly mark: number
}
