import { ArrayNotEmpty, ArrayUnique, IsMongoId } from 'class-validator'
import { ArgsType, Field, ID } from 'type-graphql'

@ArgsType()
export default class GetCategoryRatingMarksRequest {

  @IsMongoId({ each: true })
  @ArrayNotEmpty()
  @ArrayUnique()
  @Field(_type => [ ID! ])
  public readonly categoryIds: string[]
}