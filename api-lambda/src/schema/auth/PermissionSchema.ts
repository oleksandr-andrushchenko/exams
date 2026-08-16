import Permission from '../../enums/Permission'
import PermissionHierarchySchema from './PermissionHierarchySchema'

export default class PermissionSchema {
  public items?: Permission[] = []

  public hierarchy?: PermissionHierarchySchema = {}
}
