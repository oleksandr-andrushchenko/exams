import PaginationSchema from '../schema/pagination/PaginationSchema'
import { ObjectId } from 'mongodb'
import { MongoRepository } from 'typeorm'
import PaginatedSchema, { PaginatedMetaSchema } from '../schema/pagination/PaginatedSchema'

/**
 * @see https://engage.so/blog/a-deep-dive-into-offset-and-cursor-based-pagination-in-mongodb/#challenges-of-cursor-based-pagination
 */
export default class Cursor<Entity> {

  public constructor(
    private readonly pagination: PaginationSchema,
    private repository: MongoRepository<Entity> = undefined,
  ) {
  }

  public async getPaginated({ where = {}, meta = false }): Promise<Entity[] | PaginatedSchema<Entity>> {
    const order = {
      key: '',
      direction: -1,
    }

    let cursor: string

    if (this.pagination.prevCursor) {
      cursor = this.pagination.prevCursor

      if (this.pagination.order === 'desc') {
        order.key = '$gt'
        order.direction = 1
      } else {
        order.key = '$lt'
        order.direction = -1
      }
    } else if (this.pagination.nextCursor) {
      cursor = this.pagination.nextCursor

      if (this.pagination.order === 'desc') {
        order.key = '$lt'
        order.direction = -1
      } else {
        order.key = '$gt'
        order.direction = 1
      }
    } else {
      if (this.pagination.order === 'desc') {
        order.direction = -1
      } else {
        order.direction = 1
      }
    }

    const sort = {}

    let cursorParam: string | number | Date

    if (cursor) {
      let [ id, param ] = cursor.split('_')

      const cursorId = new ObjectId(id)

      if (param) {
        if ([ 'createdAt', 'updatedAt' ].includes(param)) {
          cursorParam = new Date(param)
        }

        where['$or'] = [
          { [this.pagination.cursor == 'id' ? '_id' : this.pagination.cursor]: { [order.key]: cursorParam } },
          {
            [this.pagination.cursor == 'id' ? '_id' : this.pagination.cursor]: cursorParam,
            _id: { [order.key]: cursorId },
          },
        ]
        sort[this.pagination.cursor == 'id' ? '_id' : this.pagination.cursor] = order.direction
      } else {
        where['_id'] = { [order.key]: cursorId }
      }
    }

    sort['_id'] = order.direction

    const data = await this.repository.find({ where, take: this.pagination.size, order: sort })

    if (this.pagination.prevCursor) {
      data.reverse()
    }

    if (!meta) {
      return data
    }

    let hasNext: boolean, hasPrev: boolean

    if (data.length) {
      order.key = (this.pagination.order === 'desc') ? '$lt' : '$gt'
      cursorParam = data[data.length - 1][this.pagination.cursor]

      if (this.pagination.cursor === 'id') {
        where['_id'] = { [order.key]: new ObjectId(cursorParam as string) }
      } else {
        if ([ 'createdAt', 'updatedAt' ].includes(this.pagination.cursor)) {
          cursorParam = new Date(cursorParam)
        }

        where['$or'] = [
          { [this.pagination.cursor == 'id' ? '_id' : this.pagination.cursor]: { [order.key]: cursorParam } },
          {
            [this.pagination.cursor == 'id' ? '_id' : this.pagination.cursor]: cursorParam,
            _id: { [order.key]: new ObjectId(data[data.length - 1]['id']) },
          },
        ]
      }

      hasNext = !!await this.repository.findOne({ where })

      order.key = (this.pagination.order === 'desc') ? '$gt' : '$lt'
      cursorParam = data[0][this.pagination.cursor]

      if (this.pagination.cursor === 'id') {
        where['_id'] = { [order.key]: new ObjectId(cursorParam as string) }
      } else {
        if ([ 'createdAt', 'updatedAt' ].includes(this.pagination.cursor)) {
          cursorParam = new Date(cursorParam)
        }

        where['$or'] = [
          { [this.pagination.cursor == 'id' ? '_id' : this.pagination.cursor]: { [order.key]: cursorParam } },
          {
            [this.pagination.cursor == 'id' ? '_id' : this.pagination.cursor]: cursorParam,
            _id: { [order.key]: new ObjectId(data[0]['id']) },
          },
        ]
      }

      hasPrev = !!await this.repository.findOne({ where })
    }

    const paginated = new PaginatedSchema<Entity>()
    paginated.data = data
    paginated.meta = new PaginatedMetaSchema()
    paginated.meta.cursor = this.pagination.cursor
    paginated.meta.size = this.pagination.size
    paginated.meta.order = this.pagination.order

    if (hasNext) {
      paginated.meta.nextCursor = data[data.length - 1]['id'].toString()

      if (this.pagination.cursor !== 'id') {
        paginated.meta.nextCursor += '_' + data[data.length - 1][this.pagination.cursor]
      }

      paginated.meta.nextUrl = `${ this.getUrl(paginated.meta) }&nextCursor=${ paginated.meta.nextCursor }`
    }

    if (hasPrev) {
      paginated.meta.prevCursor = data[0]['id'].toString()

      if (this.pagination.cursor !== 'id') {
        paginated.meta.prevCursor += '_' + data[0][this.pagination.cursor]
      }

      paginated.meta.prevUrl = `${ this.getUrl(paginated.meta) }&prevCursor=${ paginated.meta.prevCursor }`
    }

    return paginated
  }

  private getUrl(meta: PaginatedMetaSchema): string {
    return `?cursor=${ meta.cursor }&size=${ meta.size }&order=${ meta.order }`
  }
}