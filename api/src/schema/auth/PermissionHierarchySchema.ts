import { Field, ObjectType } from 'type-graphql'
import Permission from '../../enums/Permission'

@ObjectType()
export default class PermissionHierarchySchema {

  @Field(_type => [ String ], { nullable: true })
  public [Permission.Regular]?: string[] = []

  @Field(_type => [ String ], { nullable: true })
  public [Permission.Root]?: string[] = [
    Permission.All,
  ]
}