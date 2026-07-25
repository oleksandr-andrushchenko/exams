import { Field, ObjectType } from 'type-graphql'
import Permission from '../../enums/Permission'
import PermissionHierarchySchema from './PermissionHierarchySchema'

@ObjectType()
export default class PermissionSchema {

  @Field(_type => [ String ], { nullable: true })
  public items?: Permission[] = []

  @Field(_type => PermissionHierarchySchema, { nullable: true })
  public hierarchy?: PermissionHierarchySchema = {}
}