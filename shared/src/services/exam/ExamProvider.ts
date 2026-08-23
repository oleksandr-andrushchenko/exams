import { Inject, Service } from 'typedi'
import { ObjectId } from 'bson'
import Exam from '../../entities/exam/Exam'
import ExamRepository from '../../repositories/exams/ExamRepository'
import ExamNotFoundError from '../../errors/exam/ExamNotFoundError'
import UserRepository from '../../repositories/users/UserRepository'

@Service()
export default class ExamProvider {
  public constructor(
    @Inject() private readonly examRepository: ExamRepository,
    @Inject() private readonly userRepository: UserRepository
  ) {
  }

  private async decorateExam(exam: Exam): Promise<Exam> {
    const creator = await this.userRepository.findOneById(exam.creatorId)
    return Object.assign(exam, {
      creator: creator,
      userSlug: creator?.slug
    })
  }

  private async decorateExams(exams: Exam[]): Promise<Exam[]> {
    return Promise.all(exams.map((exam) => this.decorateExam(exam)))
  }

  public async getExam(id: ObjectId | string): Promise<Exam> {
    const exam = await this.examRepository.findOneById(id)
    if (!exam) {
      throw new ExamNotFoundError(id)
    }
    return this.decorateExam(exam)
  }

  public async getExamBySlugs(_userSlug: string, slug: string): Promise<Exam> {
    const exam = await this.examRepository.findOneBySlug(slug)
    if (!exam) {
      throw new ExamNotFoundError(slug)
    }
    return this.decorateExam(exam)
  }

  public async getLastExams(): Promise<Exam[]> {
    const exams = await this.examRepository.findLastExams()
    return await this.decorateExams(exams)
  }

  public async getPopularExams(): Promise<Exam[]> {
    const exams = await this.examRepository.findPopularExams()
    return await this.decorateExams(exams)
  }
}
