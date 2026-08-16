import { IsMongoId } from 'class-validator'

export default class GetExamSession {
  @IsMongoId()
  public readonly examSessionId: string
}
