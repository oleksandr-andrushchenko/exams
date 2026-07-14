import { MongoRepository } from 'typeorm'
import { ObjectId } from 'mongodb'
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral'
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions'
import { CountOptions, Document, FilterOperators } from 'typeorm/driver/mongodb/typings'
import { UpdateResult } from 'typeorm/query-builder/result/UpdateResult'
import { MongoFindOneOptions } from 'typeorm/find-options/mongodb/MongoFindOneOptions'
import { PickKeysByType } from 'typeorm/common/PickKeysByType'

export default class EntityRepository<Entity extends ObjectLiteral> extends MongoRepository<Entity> {

  public async findOneBy(where: any): Promise<Entity | null> {
    where.deletedAt = { $exists: false }

    return await super.findOne({ where })
  }

  public findOne(options: MongoFindOneOptions<Entity>): Promise<Entity | null> {
    if ('where' in options) {
      options.where['deletedAt'] = { $exists: false }
    } else {
      options.where = { deletedAt: { $exists: false } }
    }

    return super.findOne(options)
  }

  public findBy(where: any): Promise<Entity[]> {
    where.deletedAt = { $exists: false }

    return super.find({ where })
  }

  public async findOneById(id: string | number | Date | ObjectId): Promise<Entity | null> {
    return await this.findOneBy({ _id: id })
  }

  public async findByIds(ids: ObjectId[]): Promise<Entity[]> {
    return await this.findBy({ _id: { $in: ids } })
  }

  public async find(options?: FindManyOptions<Entity> | Partial<Entity> | FilterOperators<Entity>): Promise<Entity[]> {
    if ('where' in options) {
      options.where.deletedAt = { $exists: false }
    } else {
      options.where = { deletedAt: { $exists: false } }
    }

    return await super.find(options)
  }

  public async count(query?: ObjectLiteral, options?: CountOptions): Promise<number> {
    query['deletedAt'] = { $exists: false }

    return await super.count(query, options)
  }

  public countBy(query?: ObjectLiteral, options?: CountOptions): Promise<number> {
    query['deletedAt'] = { $exists: false }

    return super.countBy(query, options)
  }

  public async sumBy(columnName: PickKeysByType<Entity, number>, where: any = {}): Promise<number | null> {
    where.deletedAt = { $exists: false }

    const res = await this.aggregate([
      {
        $match: where,
      },
      {
        $group: {
          _id: null,
          sum: { $sum: `$${ columnName }` },
        },
      },
    ]).toArray()

    return res.length > 0 ? res[0].sum : null
  }

  public async updateOneByEntity(
    entity: Entity,
    set: Partial<Entity> = {},
  ): Promise<Document | UpdateResult> {
    const update: { $set: Partial<Entity>, $unset: Record<string, ''> } = { $set: {}, $unset: {} }

    for (const prop in set) {
      if (set.hasOwnProperty(prop)) {
        if (set[prop] === undefined) {
          delete entity[prop]
          update.$unset[prop as string] = ''
        } else {
          entity[prop] = update.$set[prop] = set[prop]
        }
      }
    }

    if (Object.keys(update.$set).length === 0) {
      delete update.$set
    }

    if (Object.keys(update.$unset).length === 0) {
      delete update.$unset
    }

    return await this.updateOne({ _id: entity.id }, update)
  }
}