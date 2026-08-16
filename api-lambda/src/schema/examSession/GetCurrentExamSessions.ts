import { ArrayNotEmpty, ArrayUnique, IsArray, IsMongoId, ValidateNested } from 'class-validator'

export default class GetCurrentExamSessions {
  // @IsArray()
  @IsMongoId({ each: true })
  @ArrayNotEmpty()
  @ArrayUnique()
  // @ValidateNested({ each: true })
  public readonly examIds: string[]
}
