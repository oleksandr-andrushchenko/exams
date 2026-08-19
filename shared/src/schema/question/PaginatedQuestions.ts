import PaginatedSchema from '../pagination/PaginatedSchema'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import Question from '../../entities/question/Question'

export default class PaginatedQuestions extends PaginatedSchema<Question> {
  @ValidateNested({ each: true })
  @Type(() => Question)
  public data: Question[]
}
