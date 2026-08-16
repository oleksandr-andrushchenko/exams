import { Inject, Service } from 'typedi'
import ExamTag from '../entities/examTag/ExamTag'
import ExamTagRepository from '../repositories/examTag/ExamTagRepository'
import GetExamTags from '../schema/examTag/GetExamTags'
import ValidatorInterface from '../services/validator/ValidatorInterface'

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
}
