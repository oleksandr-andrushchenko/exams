import { Column, Entity } from 'typeorm'
import { ObjectId } from 'bson'
import { Field, Int, ObjectType } from 'type-graphql'
import { GraphQLTimestamp } from 'graphql-scalars'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import Base from '../Base'
import ExamSessionQuestion from './ExamSessionQuestion'
import ObjectIdTransformer from '../../database/ObjectIdTransformer'
import ObjectIdJsonTransformer from '../../database/ObjectIdJsonTransformer'

@ObjectType()
@Entity({ name: 'examSessions' })
export default class ExamSession extends Base {
  @Column({ type: 'varchar', length: 24, transformer: ObjectIdTransformer })
  @Field((_type) => ObjectIdScalar)
  public examId: ObjectId

  @Column({ type: 'jsonb', transformer: ObjectIdJsonTransformer })
  public questions: ExamSessionQuestion[]

  @Column({ type: 'integer', nullable: true })
  @Field((_type) => Int, { nullable: true })
  public questionNumber?: number = 0

  @Column({ type: 'integer', nullable: true })
  @Field((_type) => Int, { nullable: true })
  public correctAnswerCount?: number = 0

  @Column({ type: 'timestamptz', nullable: true })
  @Field((_type) => GraphQLTimestamp, { nullable: true })
  public completedAt?: Date

  @Field((_type) => Int)
  public questionCount(): number {
    return this.questions?.length || 0
  }

  @Field((_type) => Int)
  public answeredQuestionCount(): number {
    return (this?.questions || []).filter(
      (question: ExamSessionQuestion): boolean =>
        typeof question.choice === 'number' || typeof question.answer === 'string'
    ).length
  }
}
