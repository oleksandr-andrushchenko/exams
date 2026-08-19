import PaginatedSchema from '../pagination/PaginatedSchema'
import Exam from '../../entities/exam/Exam'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export default class PaginatedExams extends PaginatedSchema<Exam> {
  @ValidateNested({ each: true })
  @Type(() => Exam)
  public data: Exam[]
}
