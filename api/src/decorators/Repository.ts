import { Constructable, Container } from 'typedi'
import { ConnectionManager, EntityTarget, MongoRepository } from 'typeorm'

export default function Repository(entity: Constructable<unknown>, connection: string = 'default'): ClassDecorator {
  return <T = Constructable<unknown>>(repositoryType: T): void => {
    Container.set({
      id: repositoryType,
      type: repositoryType as any,
      factory: () => {
        const em = Container.get(ConnectionManager).get(connection).manager
        const {
          target,
          manager,
          queryRunner
        } = em[`get${ repositoryType instanceof MongoRepository ? 'Mongo' : '' }Repository`](entity as EntityTarget<typeof entity>)
        return new (repositoryType as any)(target, manager, queryRunner)
      }
    })
  }
}
