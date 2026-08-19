import { Inject, Service } from 'typedi'
import ExamTag from '../../../shared/src/entities/examTag/ExamTag'
import ExamTagRepository from '../../../shared/src/repositories/exams/ExamTagRepository'
import GetExamTags from '../../../shared/src/schema/examTag/GetExamTags'
import ValidatorInterface from '../../../shared/src/services/validator/ValidatorInterface'
import { type Request, type Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { queryObject } from '../../../shared/src/http'

@Service()
export class ExamTagController {
  public constructor(
    @Inject() private readonly repository: ExamTagRepository,
    @Inject('validator') private readonly validator: ValidatorInterface
  ) {}

  public async getExamTags(request: GetExamTags): Promise<ExamTag[]> {
    await this.validator.validate(request)
    return this.repository.findMatching(request.search, request.size)
  }

  public getExamsCount(tag: ExamTag): Promise<number> {
    return this.repository.countExams(tag)
  }
  public async route(request: Request, response: Response): Promise<void> {
    const tags = await this.getExamTags(plainToInstance(GetExamTags, queryObject(request.query)))
    response.json(await Promise.all(tags.map(async (tag) => ({ ...tag, examsCount: await this.getExamsCount(tag) }))))
  }
}
