import { Inject, Service } from 'typedi'
import { type Request, type Response } from 'express'
import { namedError } from '../../../shared/src/errors'
import TagRepository from '../../../shared/src/repositories/questions/TagRepository'

@Service()
export default class TagController {
  public constructor(@Inject() private readonly tagRepository: TagRepository) {
  }

  public async getTag(request: Request, response: Response): Promise<void> {
    const tag = await this.tagRepository.getTag(request.params.slug)
    if (!tag) throw namedError('PageNotFoundError', 'Tag not found')
    response.render('tag.html', { tag, title: tag.name })
  }
}
