import Question from '../../entities/question/Question'
import { Field, Int, ObjectType } from 'type-graphql'
import Exam from '../../entities/exam/Exam'

@ObjectType()
export default class ExamQuestionSchema {

  @Field(_type => Exam, { nullable: true })
  public exam?: Exam

  @Field(_type => Question, { nullable: true })
  public question?: Question

  @Field(_type => [ String! ], { nullable: true })
  public choices?: string[]

  @Field(_type => Int, { nullable: true })
  public number?: number

  @Field(_type => Int, { nullable: true })
  public choice?: number

  @Field({ nullable: true })
  public answer?: string
}