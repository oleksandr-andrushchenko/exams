import { Inject, Service } from 'typedi'
import ExamTagRepository from "../../repositories/exams/ExamTagRepository";
import ExamTagNotFoundError from "../../errors/examTag/ExamTagNotFoundError";
import ExamTag from "../../entities/examTag/ExamTag";

@Service()
export default class ExamTagProvider {
  public constructor(
    @Inject() private readonly examTagRepository: ExamTagRepository,
  ) {
  }

  public async getExamTagBySlug(slug: string): Promise<ExamTag> {
    const examTag = await this.examTagRepository.findOneBySlug(slug)
    if (!examTag) {
      throw new ExamTagNotFoundError(slug)
    }
    return examTag
  }
}
