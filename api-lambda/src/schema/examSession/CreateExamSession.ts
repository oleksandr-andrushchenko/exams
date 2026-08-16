import { IsMongoId } from 'class-validator'

export default class CreateExamSession {
  @IsMongoId()
  public readonly examId: string
}
