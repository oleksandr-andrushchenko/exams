import { ArrayUnique, IsEnum, IsOptional } from 'class-validator'
import Permission from '../../enums/Permission'
import CreateMe from './CreateMe'
import { Field, InputType } from 'type-graphql'

@InputType()
export default class CreateUser extends CreateMe {

  @IsOptional()
  @IsEnum(Permission, { each: true })
  @ArrayUnique()
  @Field(_type => [ String ])
  public readonly permissions?: Permission[] = [ Permission.Regular ]
}