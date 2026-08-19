import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min
} from 'class-validator'

export default class CreateExam {
  @Length(3, 100)
  public readonly name: string

  @IsOptional()
  @IsString()
  @Length(1, 255)
  public readonly imageFilename?: string

  @Min(0)
  @Max(100)
  @IsNumber({ maxDecimalPlaces: 0 })
  public readonly requiredScore?: number = 0

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 50, { each: true })
  @Matches(/\S/, { each: true })
  public readonly tags?: string[] = []
}
