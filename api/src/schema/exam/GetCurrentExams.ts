import { ArrayNotEmpty, ArrayUnique, IsArray, IsMongoId, ValidateNested } from 'class-validator'
import { ArgsType, Field, ID } from 'type-graphql'

@ArgsType()
export default class GetCurrentExams {

  // @IsArray()
  @IsMongoId({ each: true })
  @ArrayNotEmpty()
  @ArrayUnique()
  // @ValidateNested({ each: true })
  @Field(_type => [ ID! ])
  public readonly categoryIds: string[]
}