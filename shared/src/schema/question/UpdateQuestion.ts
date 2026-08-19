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

export default class UpdateQuestion {
  @ValidateIf((target) => 'examId' in target)
  @IsMongoId()
  public readonly examId?: string

  @ValidateIf((target) => 'type' in target)
  @IsEnum(QuestionType)
  public readonly type?: QuestionType

  @ValidateIf((target) => 'difficulty' in target)
  @IsEnum(QuestionDifficulty)
  public readonly difficulty?: QuestionDifficulty

  @ValidateIf((target) => 'title' in target)
  @Length(10, 3000)
  public readonly title?: string

  @ValidateIf((target) => 'imageFilename' in target)
  @IsString()
  @Length(1, 255)
  public readonly imageFilename?: string

  @ValidateIf((target) => 'choices' in target)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionChoiceSchema)
  public readonly choices?: QuestionChoiceSchema[]
}
