import { IsMongoId } from 'class-validator'
import { ArgsType, Field, ID } from 'type-graphql'

@ArgsType()
export default class GetExam {

  @IsMongoId()
  @Field(_type => ID)
  public readonly examId: string
}