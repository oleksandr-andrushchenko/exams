import { IsNumber, Max, Min } from 'class-validator'
import GetExam from './GetExam'

export default class RateExamRequest extends GetExam {
  @Min(0)
  @Max(5)
  @IsNumber({ maxDecimalPlaces: 0 })
  public readonly mark: number
}
