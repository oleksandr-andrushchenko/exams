import PaginatedSchema from '../pagination/PaginatedSchema'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import ExamSession from '../../entities/examSession/ExamSession'

export default class PaginatedExamSessions extends PaginatedSchema<ExamSession> {
  @ValidateNested({ each: true })
  @Type(() => ExamSession)
  public data: ExamSession[]
}
