import PaginatedSchema from '../pagination/PaginatedSchema'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import Question from '../../entities/question/Question'
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export default class PaginatedQuestions extends PaginatedSchema<Question> {

  @ValidateNested({ each: true })
  @Type(() => Question)
  @Field(_type => [ Question ])
  public data: Question[]
}