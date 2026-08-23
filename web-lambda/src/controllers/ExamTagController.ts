import { Inject, Service } from 'typedi'
import { type Request, type Response } from 'express'
import ExamTagProvider from '../../../shared/src/services/examTag/ExamTagProvider'

@Service()
export default class ExamTagController {
  public constructor(
    @Inject() private readonly examTagProvider: ExamTagProvider,
  ) {
  }

  public async showExamTag(request: Request, response: Response): Promise<void> {
    const examTag = await this.examTagProvider.getExamTagBySlug(request.params.slug)
    response.render('exam-tag.html', {
      examTag,
      title: examTag.name
    })
  }
}
