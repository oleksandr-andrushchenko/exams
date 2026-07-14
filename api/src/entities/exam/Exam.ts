import { Column, Entity } from 'typeorm'
import { ObjectId } from 'mongodb'
import { Field, Int, ObjectType } from 'type-graphql'
import { GraphQLTimestamp } from 'graphql-scalars'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import Base from '../Base'
import ExamQuestion from './ExamQuestion'

@ObjectType()
@Entity({ name: 'exams' })
export default class Exam extends Base {

  @Column()
  @Field(_type => ObjectIdScalar)
  public categoryId: ObjectId

  @Column(() => ExamQuestion)
  public questions: ExamQuestion[]

  @Column()
  @Field(_type => Int, { nullable: true })
  public questionNumber?: number = 0

  @Column()
  @Field(_type => Int, { nullable: true })
  public correctAnswerCount?: number = 0

  @Column()
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
