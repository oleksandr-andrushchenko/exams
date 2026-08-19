import Permission from '../../enums/Permission'

export default class PermissionHierarchySchema {
  public [Permission.Regular]?: string[] = []

  public [Permission.Root]?: string[] = [Permission.All]
}
