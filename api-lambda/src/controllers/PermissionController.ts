import { Inject, Service } from 'typedi'
import PermissionSchema from '../schema/auth/PermissionSchema'
import Permission from '../enums/Permission'
import PermissionHierarchySchema from '../schema/auth/PermissionHierarchySchema'

@Service()
export class PermissionController {
  public constructor(@Inject('authPermissions') private readonly permissions: PermissionHierarchySchema) {}

  public async getPermission(): Promise<PermissionSchema> {
    const permission = new PermissionSchema()
    permission.items = Object.values(Permission)
    permission.hierarchy = this.permissions

    return permission
  }
}
