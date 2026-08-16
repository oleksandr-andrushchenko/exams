import { Args, FieldResolver, Int, Query, Resolver, Root } from 'type-graphql'
import { Inject, Service } from 'typedi'
import ExamTag from '../entities/examTag/ExamTag'
import ExamTagRepository from '../repositories/examTag/ExamTagRepository'
import GetExamTags from '../schema/examTag/GetExamTags'
import ValidatorInterface from '../services/validator/ValidatorInterface'

@Service()
@Resolver(ExamTag)
export class ExamTagResolver {
  public constructor(
    @Inject() private readonly repository: ExamTagRepository,
    @Inject('validator') private readonly validator: ValidatorInterface
  ) {}

  @Query((_returns) => [ExamTag], { name: 'examTags' })
  public async getExamTags(@Args() request: GetExamTags): Promise<ExamTag[]> {
    await this.validator.validate(request)
    return this.repository.findMatching(request.search, request.size)
  }

  @FieldResolver((_returns) => Int, { name: 'examsCount' })
  public getExamsCount(@Root() tag: ExamTag): Promise<number> {
    return this.repository.countExams(tag)
  }
}
