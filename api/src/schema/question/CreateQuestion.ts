import { ArrayNotEmpty, IsEnum, IsMongoId, Length, ValidateIf, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { Field, ID, InputType } from 'type-graphql'
import { QuestionChoiceSchema } from './QuestionChoiceSchema'
import QuestionType from '../../entities/question/QuestionType'
import QuestionDifficulty from '../../entities/question/QuestionDifficulty'

@InputType()
export default class CreateQuestion {

  @IsMongoId()
  @Field(_type => ID)
  public readonly categoryId: string

  @IsEnum(QuestionType)
  @Field()
  public readonly type: QuestionType

  @IsEnum(QuestionDifficulty)
  @Field()
  public readonly difficulty: QuestionDifficulty

  @Length(10, 3000)
  @Field()
  public readonly title: string

  @ValidateIf(target => target.type === QuestionType.CHOICE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionChoiceSchema)
  @Field(_type => [ QuestionChoiceSchema! ], { nullable: true })
  public readonly choices?: QuestionChoiceSchema[]
}