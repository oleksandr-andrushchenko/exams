import { ArrayUnique, IsEnum, IsOptional } from 'class-validator'
import Permission from '../../enums/Permission'
import CreateMe from './CreateMe'

export default class CreateUser extends CreateMe {
  @IsOptional()
  @IsEnum(Permission, { each: true })
  @ArrayUnique()
  public readonly permissions?: Permission[] = [Permission.Regular]
}
