import Question from '../../entities/question/Question'
import { Field, Int, ObjectType } from 'type-graphql'
import ExamSession from '../../entities/examSession/ExamSession'

@ObjectType()
export default class ExamSessionQuestionSchema {

  @Field(_type => ExamSession, { nullable: true })
  public examSession?: ExamSession

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