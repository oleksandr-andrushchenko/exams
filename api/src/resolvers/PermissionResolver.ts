import { Inject, Service } from 'typedi'
import { Authorized, Query, Resolver } from 'type-graphql'
import PermissionSchema from '../schema/auth/PermissionSchema'
import Permission from '../enums/Permission'
import PermissionHierarchySchema from '../schema/auth/PermissionHierarchySchema'

@Service()
@Resolver()
export class PermissionResolver {

  public constructor(
    @Inject('authPermissions') private readonly permissions: PermissionHierarchySchema,
  ) {
  }

  @Authorized()
  @Query(_returns => PermissionSchema, { name: 'permission' })
  public async getPermission(): Promise<PermissionSchema> {
    const permission = new PermissionSchema()
    permission.items = Object.values(Permission)
    permission.hierarchy = this.permissions

    return permission
  }
}