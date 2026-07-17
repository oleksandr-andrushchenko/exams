import { Column, Entity } from 'typeorm'
import { ObjectId } from 'bson'
import { Field, Int, ObjectType } from 'type-graphql'
import { GraphQLTimestamp } from 'graphql-scalars'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import Base from '../Base'
import ExamQuestion from './ExamQuestion'
import ObjectIdTransformer from '../../database/ObjectIdTransformer'
import ObjectIdJsonTransformer from '../../database/ObjectIdJsonTransformer'

@ObjectType()
@Entity({ name: 'exams' })
export default class Exam extends Base {

  @Column({ type: 'varchar', length: 24, transformer: ObjectIdTransformer })
  @Field(_type => ObjectIdScalar)
  public categoryId: ObjectId

  @Column({ type: 'jsonb', transformer: ObjectIdJsonTransformer })
  public questions: ExamQuestion[]

  @Column({ type: 'integer', nullable: true })
  @Field(_type => Int, { nullable: true })
  public questionNumber?: number = 0

  @Column({ type: 'integer', nullable: true })
  @Field(_type => Int, { nullable: true })
  public correctAnswerCount?: number = 0

  @Column({ type: 'timestamptz', nullable: true })
  @Field(_type => GraphQLTimestamp, { nullable: true })
  public completedAt?: Date

  @Field(_type => Int)
  public questionCount(): number {
    return this.questions?.length || 0
  }

  @Field(_type => Int)
  public answeredQuestionCount(): number {
    return (this?.questions || [])
      .filter((question: ExamQuestion): boolean => typeof question.choice === 'number' || typeof question.answer === 'string')
      .length
  }
}
