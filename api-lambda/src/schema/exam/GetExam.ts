import { IsMongoId } from 'class-validator'

export default class GetExam {
  @IsMongoId()
  public readonly examId: string
}
