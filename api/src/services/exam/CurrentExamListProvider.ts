import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import ExamRepository from '../../repositories/ExamRepository'
import Exam from '../../entities/exam/Exam'
import Category from '../../entities/category/Category'

@Service()
export default class CurrentExamListProvider {

  public constructor(
    @Inject() private readonly examRepository: ExamRepository,
  ) {
  }

  /**
   * @param {Category[]} categories
   * @param {User} initiator
   * @returns {Promise<Exam[]>}
   */
  public async getCurrentExams(categories: Category[], initiator: User): Promise<Exam[]> {
    return await this.examRepository.findByCategoriesAndOwnerWithoutCompleted(categories, initiator)
  }
}