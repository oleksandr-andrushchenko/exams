import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export default class GetExamTags {
  @IsOptional()
  @IsString()
  public readonly search?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  public readonly size?: number = 20
}
