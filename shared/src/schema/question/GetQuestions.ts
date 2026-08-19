import PaginationSchema from '../pagination/PaginationSchema'
import { IsEnum, IsIn, IsMongoId, IsOptional, IsString } from 'class-validator'
import QuestionDifficulty from '../../entities/question/QuestionDifficulty'
import QuestionType from '../../entities/question/QuestionType'

export default class GetQuestions extends PaginationSchema {
  @IsOptional()
  @IsMongoId()
  public exam?: string

  @IsOptional()
  @IsIn(['yes', 'no'])
  public readonly subscription?: string

  @IsOptional()
  @IsIn(['yes', 'no'])
  public approved?: string

  @IsOptional()
  @IsString()
  public readonly search?: string

  @IsOptional()
  @IsEnum(QuestionDifficulty)
  public readonly difficulty?: QuestionDifficulty

  @IsOptional()
  @IsEnum(QuestionType)
  public readonly type?: QuestionType

  @IsOptional()
  @IsIn(['i', 'somebody'])
  public creator?: string
}
