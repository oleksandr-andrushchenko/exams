import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsNumber,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf
} from 'class-validator'

export default class UpdateExam {
  @ValidateIf((target) => 'name' in target)
  @Length(3, 100)
  public readonly name?: string

  @ValidateIf((target) => 'imageFilename' in target)
  @IsString()
  @Length(1, 255)
  public readonly imageFilename?: string

  @ValidateIf((target) => 'requiredScore' in target)
  @Min(0)
  @Max(100)
  @IsNumber({ maxDecimalPlaces: 0 })
  public readonly requiredScore?: number

  @ValidateIf((target) => 'tags' in target)
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 50, { each: true })
  @Matches(/\S/, { each: true })
  public readonly tags?: string[]
}
