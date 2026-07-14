import { IsMongoId } from 'class-validator'
import { Field, ID, InputType } from 'type-graphql'

@InputType()
export default class CreateExam {

  @IsMongoId()
  @Field(_type => ID)
  public readonly categoryId: string
}