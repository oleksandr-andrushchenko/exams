import PaginationSchema from '../pagination/PaginationSchema'
import { IsIn, IsMongoId, IsOptional, IsString, Matches } from 'class-validator'

export default class GetExams extends PaginationSchema {
  @IsOptional()
  @IsMongoId()
  public readonly userId?: string

  @IsOptional()
  @IsIn(['yes', 'no'])
  public readonly subscription?: string

  @IsOptional()
  @IsIn(['yes', 'no'])
  public readonly approved?: string

  @IsOptional()
  @IsString()
  public readonly search?: string

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  public readonly tag?: string

  @IsOptional()
  @IsIn(['i', 'somebody'])
  public creator?: string
}
