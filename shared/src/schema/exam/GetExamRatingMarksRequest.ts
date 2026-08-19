import { ArrayNotEmpty, ArrayUnique, IsMongoId } from 'class-validator'

export default class GetExamRatingMarksRequest {
  @IsMongoId({ each: true })
  @ArrayNotEmpty()
  @ArrayUnique()
  public readonly examIds: string[]
}
