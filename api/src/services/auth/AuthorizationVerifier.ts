import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import AuthorizationFailedError from '../../errors/auth/AuthorizationFailedError'
import Permission from '../../enums/Permission'
import { ObjectId } from 'mongodb'
import PermissionHierarchySchema from '../../schema/auth/PermissionHierarchySchema'

@Service()
export default class AuthorizationVerifier {

  public constructor(
    @Inject('authPermissions') private readonly permissions: PermissionHierarchySchema,
  ) {
  }

  /**
   * @param {User} user
   * @param {string} permission
   * @param {{ownerId? => ObjectId}} resource
   * @param {string[]} permissions
   * @returns {Promise<boolean>}
   * @throws {AuthorizationFailedError}
   */
  public async verifyAuthorization(
    user: User,
    permission: string,
    resource: { ownerId?: ObjectId } = undefined,
    permissions: string[] = undefined,
  ): Promise<boolean> {
    if (resource) {
      if (resource instanceof User) {
        resource = { ...resource, ownerId: resource.id }
      }

      if (!!resource.ownerId && resource.ownerId.toString() === user.id.toString()) {
        return true
      }
    }

    permissions = permissions ?? user.permissions

    if (permissions.indexOf(Permission.All) !== -1) {
      return true
    }

    if (permissions.indexOf(permission) !== -1) {
      return true
    }

    for (const userPermission of permissions) {
      if (this.permissions.hasOwnProperty(userPermission)) {
        if (await this.verifyAuthorization(user, permission, resource, this.permissions[userPermission])) {
          return true
        }
      }
    }

    throw new AuthorizationFailedError(permission)
  }
}