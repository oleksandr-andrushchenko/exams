import PaginationSchema from '../pagination/PaginationSchema'
import { IsOptional, IsString } from 'class-validator'

export default class GetUsers extends PaginationSchema {
  @IsOptional()
  @IsString()
  public readonly search?: string
}
