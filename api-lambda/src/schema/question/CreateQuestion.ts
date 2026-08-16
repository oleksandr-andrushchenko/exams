import {
  ArrayNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  IsMongoId,
  Length,
  ValidateIf,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'
import { QuestionChoiceSchema } from './QuestionChoiceSchema'
import QuestionType from '../../entities/question/QuestionType'
import QuestionDifficulty from '../../entities/question/QuestionDifficulty'

export default class CreateQuestion {
  @IsMongoId()
  public readonly examId: string

  @IsEnum(QuestionType)
  public readonly type: QuestionType

  @IsEnum(QuestionDifficulty)
  public readonly difficulty: QuestionDifficulty

  @Length(10, 3000)
  public readonly title: string

  @IsOptional()
  @IsString()
  @Length(1, 255)
  public readonly imageFilename?: string

  @ValidateIf((target) => target.type === QuestionType.CHOICE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionChoiceSchema)
  public readonly choices?: QuestionChoiceSchema[]
}
