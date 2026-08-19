import { FindManyOptions, FindOptionsWhere, ILike, In, IsNull, Not, ObjectLiteral, Repository } from 'typeorm'
import { ObjectId } from 'bson'

export default class EntityRepository<Entity extends ObjectLiteral> extends Repository<Entity> {
  public findOneBy(where: any): Promise<Entity | null> {
    return super.findOne({ where: this.normalize({ ...where, deletedAt: { $exists: false } }) })
  }

  public findOne(options: any = {}): Promise<Entity | null> {
    return super.findOne({
      ...options,
      where: this.normalize({ ...(options.where ?? {}), deletedAt: { $exists: false } })
    })
  }

  public findBy(where: any): Promise<Entity[]> {
    return super.find({ where: this.normalize({ ...where, deletedAt: { $exists: false } }) })
  }

  public findOneById(id: string | ObjectId): Promise<Entity | null> {
    return this.findOneBy({ id })
  }

  public findByIds(ids: ObjectId[]): Promise<Entity[]> {
    return this.findBy({ id: { $in: ids } })
  }

  public find(options: FindManyOptions<Entity> | any = {}): Promise<Entity[]> {
    const wrapped = options && ('where' in options || 'take' in options || 'order' in options)
    return super.find({
      ...(wrapped ? options : {}),
      where: this.normalize({ ...(wrapped ? options.where : options), deletedAt: { $exists: false } })
    })
  }

  public count(query: any = {}): Promise<number> {
    return super.count({ where: this.normalize({ ...query, deletedAt: { $exists: false } }) })
  }

  public countBy(query: any = {}): Promise<number> {
    return this.count(query)
  }

  public async sumBy(columnName: keyof Entity, where: any = {}): Promise<number> {
    const result = await this.createQueryBuilder('entity')
      .select(`COALESCE(SUM(entity.${String(columnName)}), 0)`, 'sum')
      .where(this.normalize({ ...where, deletedAt: { $exists: false } }) as any)
      .getRawOne()
    return Number(result.sum)
  }

  public async updateOneByEntity(entity: Entity, changes: Partial<Entity> = {}): Promise<Entity> {
    Object.assign(entity, changes)
    for (const [key, value] of Object.entries(changes)) if (value === undefined) (entity as any)[key] = null
    return this.save(entity)
  }

  private normalize(where: any): FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[] {
    if (where.$or) return where.$or.map((part: any) => this.normalize({ ...where, $or: undefined, ...part })) as any
    const result: any = {}
    for (const [rawKey, value] of Object.entries(where)) {
      if (rawKey === '$or' || value === undefined) continue
      const key = rawKey === '_id' ? 'id' : rawKey
      if (value && typeof value === 'object' && !(value instanceof ObjectId) && !(value instanceof Date)) {
        const op: any = value
        if ('$exists' in op) result[key] = op.$exists ? Not(IsNull()) : IsNull()
        else if ('$in' in op) result[key] = In(op.$in)
        else if ('$ne' in op) result[key] = Not(op.$ne)
        else if ('$regex' in op) result[key] = ILike(`%${op.$regex}%`)
        else result[key] = value
      } else result[key] = value
    }
    return result
  }
}
