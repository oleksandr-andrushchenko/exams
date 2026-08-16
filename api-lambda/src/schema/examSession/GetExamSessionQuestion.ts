import { IsMongoId, IsNumber, Min } from 'class-validator'

export default class GetExamSessionQuestion {
  @IsMongoId()
  public readonly examSessionId: string

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  public readonly question: number
}
