import { Constructable, Container } from 'typedi'
import { ConnectionManager, MongoEntityManager } from 'typeorm'

export default function InjectEntityManager(connection: string = 'default'): ParameterDecorator {
  return (target: Constructable<unknown>, propertyKey: string | symbol, parameterIndex: number): void => {
    Container.registerHandler({
      object: target,
      propertyName: propertyKey as string,
      index: parameterIndex,
      value: container => container.get(ConnectionManager).get(connection).manager,
    })
  }
}

export { MongoEntityManager as EntityManagerInterface }
