import { IsNumber, Max, Min } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'
import GetCategory from './GetCategory'

@ArgsType()
export default class RateCategoryRequest extends GetCategory {

  @Min(1)
  @Max(5)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Field(_type => Int)
  public readonly mark: number
}