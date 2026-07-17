import PaginationSchema from '../schema/pagination/PaginationSchema'
import PaginatedSchema, { PaginatedMetaSchema } from '../schema/pagination/PaginatedSchema'
import EntityRepository from '../repositories/EntityRepository'

export default class Cursor<Entity extends Record<string, any>> {
  public constructor(private pagination: PaginationSchema, private repository: EntityRepository<Entity>) {}
  public async getPaginated({ where = {}, meta = false }): Promise<Entity[] | PaginatedSchema<Entity>> {
    const key = this.pagination.cursor || 'id'
    const direction = this.pagination.order === 'desc' ? -1 : 1
    const all = await this.repository.find({ where })
    all.sort((a, b) => {
      const left = a[key] instanceof Date ? a[key].getTime() : String(a[key])
      const right = b[key] instanceof Date ? b[key].getTime() : String(b[key])
      const primary = left === right ? 0 : left > right ? 1 : -1
      return direction * (primary || String(a.id).localeCompare(String(b.id)))
    })
    const rawCursor = this.pagination.nextCursor || this.pagination.prevCursor
    const cursorId = rawCursor?.split('_')[0]
    const cursorIndex = cursorId ? all.findIndex(item => String(item.id) === cursorId) : -1
    let start = cursorIndex + 1
    let data = all.slice(start, start + this.pagination.size)
    if (this.pagination.prevCursor) {
      const end = Math.max(0, cursorIndex)
      data = all.slice(Math.max(0, end - this.pagination.size), end)
      start = Math.max(0, end - this.pagination.size)
    }
    if (!meta) return data
    const result = new PaginatedSchema<Entity>()
    result.data = data
    result.meta = new PaginatedMetaSchema()
    Object.assign(result.meta, { cursor: key, size: this.pagination.size, order: this.pagination.order })
    const cursorFor = (item: Entity) => String(item.id) + (key === 'id' ? '' : '_' + item[key])
    if (data.length && start + data.length < all.length) result.meta.nextCursor = cursorFor(data[data.length - 1])
    if (data.length && start > 0) result.meta.prevCursor = cursorFor(data[0])
    if (result.meta.nextCursor) result.meta.nextUrl = `${ this.url(result.meta) }&nextCursor=${ result.meta.nextCursor }`
    if (result.meta.prevCursor) result.meta.prevUrl = `${ this.url(result.meta) }&prevCursor=${ result.meta.prevCursor }`
    return result
  }
  private url(meta: PaginatedMetaSchema): string { return `?cursor=${ meta.cursor }&size=${ meta.size }&order=${ meta.order }` }
}
