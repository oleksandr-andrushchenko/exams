import PaginationSchema from '../pagination/PaginationSchema'
import { IsBoolean, IsMongoId, IsOptional } from 'class-validator'

export default class GetExamSessions extends PaginationSchema {
  @IsOptional()
  @IsMongoId()
  public readonly userId?: string

  @IsOptional()
  @IsMongoId()
  public readonly examId?: string

  @IsOptional()
  @IsBoolean()
  public readonly completion?: boolean
}
