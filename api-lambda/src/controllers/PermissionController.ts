import { Inject, Service } from 'typedi'
import PermissionSchema from '../../../shared/src/schema/auth/PermissionSchema'
import Permission from '../../../shared/src/enums/Permission'
import PermissionHierarchySchema from '../../../shared/src/schema/auth/PermissionHierarchySchema'
import { type Request, type Response } from 'express'
import AuthUserProvider from '../../../shared/src/services/auth/AuthUserProvider'

@Service()
export class PermissionController {
  public constructor(
    @Inject('authPermissions') private readonly permissions: PermissionHierarchySchema,
    @Inject() private readonly authUserProvider: AuthUserProvider
  ) {}

  public async getPermission(): Promise<PermissionSchema> {
    const permission = new PermissionSchema()
    permission.items = Object.values(Permission)
    permission.hierarchy = this.permissions

    return permission
  }
  public async route(request: Request, response: Response): Promise<void> {
    await this.authUserProvider.getRequiredAuthUser(request)
    response.json(await this.getPermission())
  }
}
