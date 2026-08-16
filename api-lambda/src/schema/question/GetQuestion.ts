import { IsMongoId } from 'class-validator'

export default class GetQuestion {
  @IsMongoId()
  public readonly questionId: string
}
