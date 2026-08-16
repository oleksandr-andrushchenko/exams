import PaginatedSchema from '../pagination/PaginatedSchema'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import ExamSession from '../../entities/examSession/ExamSession'
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export default class PaginatedExamSessions extends PaginatedSchema<ExamSession> {
  @ValidateNested({ each: true })
  @Type(() => ExamSession)
  @Field((_type) => [ExamSession])
  public data: ExamSession[]
}
