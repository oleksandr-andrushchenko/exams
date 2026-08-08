import { Service } from 'typedi'
import config from '../../configuration'
import { EntityManager, In } from 'typeorm'
import ExamTag from '../../entities/examTag/ExamTag'

@Service()
export default class ExamTagManager {
  public normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ')
  }

  public slugify(name: string): string {
    return this.normalizeName(name)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  public async attach(examId: string, tags: ExamTag[], manager: EntityManager): Promise<void> {
    await manager.query('DELETE FROM \"' + config.db.schema + '\".\"examExamTags\" WHERE \"examId\" = $1', [examId])
    for (const tag of tags) {
      const [row] = await manager.query('SELECT id FROM \"' + config.db.schema + '\".\"examTags\" WHERE slug = $1', [
        tag.slug
      ])
      await manager.query(
        'INSERT INTO \"' + config.db.schema + '\".\"examExamTags\" (\"examId\", \"examTagId\") VALUES ($1, $2)',
        [examId, row.id]
      )
    }
  }

  public async resolve(names: string[] = [], manager: EntityManager): Promise<ExamTag[]> {
    const bySlug = new Map<string, string>()
    for (const rawName of names) {
      const name = this.normalizeName(rawName)
      const slug = this.slugify(name)
      if (slug && !bySlug.has(slug)) bySlug.set(slug, name)
    }
    const slugs = [...bySlug.keys()]
    if (!slugs.length) return []

    const repository = manager.getRepository(ExamTag)
    const existing = await repository.findBy({ slug: In(slugs) })
    const existingSlugs = new Set(existing.map((tag) => tag.slug))
    const missing = slugs
      .filter((slug) => !existingSlugs.has(slug))
      .map((slug) => {
        const tag = new ExamTag()
        tag.name = bySlug.get(slug)
        tag.slug = slug
        return tag
      })
    const resolved = [...existing, ...(missing.length ? await repository.save(missing) : [])]
    const resolvedBySlug = new Map(resolved.map((tag) => [tag.slug, tag]))
    return slugs.map((slug) => resolvedBySlug.get(slug)!)
  }
}
