import { ArrayNotEmpty, IsEnum, IsMongoId, Length, ValidateIf, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { Field, ID, InputType } from 'type-graphql'
import { QuestionChoiceSchema } from './QuestionChoiceSchema'
import QuestionType from '../../entities/question/QuestionType'
import QuestionDifficulty from '../../entities/question/QuestionDifficulty'

@InputType()
export default class UpdateQuestion {

  @ValidateIf(target => 'categoryId' in target)
  @IsMongoId()
  @Field(_type => ID, { nullable: true })
  public readonly categoryId?: string

  @ValidateIf(target => 'type' in target)
  @IsEnum(QuestionType)
  @Field({ nullable: true })
  public readonly type?: QuestionType

  @ValidateIf(target => 'difficulty' in target)
  @IsEnum(QuestionDifficulty)
  @Field({ nullable: true })
  public readonly difficulty?: QuestionDifficulty

  @ValidateIf(target => 'title' in target)
  @Length(10, 3000)
  @Field({ nullable: true })
  public readonly title?: string

  @ValidateIf(target => 'choices' in target)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionChoiceSchema)
  @Field(_type => [ QuestionChoiceSchema! ], { nullable: true })
  public readonly choices?: QuestionChoiceSchema[]
}