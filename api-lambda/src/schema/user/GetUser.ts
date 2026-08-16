import { IsMongoId } from 'class-validator'

export default class GetUser {
  @IsMongoId()
  public readonly userId: string
}
