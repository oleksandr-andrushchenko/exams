import { Inject, Service } from 'typedi'
import ExamRepository from '../../repositories/exam/ExamRepository'
import ExamNameTakenError from '../../errors/exam/ExamNameTakenError'
import { ObjectId } from 'bson'
import Exam from '../../entities/exam/Exam'
import ExamWithoutApprovedQuestionsError from '../../errors/exam/ExamWithoutApprovedQuestionsError'
import ExamApproveSwitcher from './ExamApproveSwitcher'
import ExamNotApprovedError from '../../errors/exam/ExamNotApprovedError'

@Service()
export default class ExamVerifier {

  public constructor(
    @Inject() private readonly examRepository: ExamRepository,
    @Inject() private readonly examApproveSwitcher: ExamApproveSwitcher,
  ) {
  }

  /**
   * @param {string} name
   * @param {ObjectId} ignoreId
   * @returns {Promise<void>}
   * @throws {ExamNameTakenError}
   */
  public async verifyExamNameNotExists(name: string, ignoreId: ObjectId = undefined): Promise<void> {
    const exam = await this.examRepository.findOneByName(name)

    if (!exam) {
      return
    }

    if (ignoreId && exam.id.toString() === ignoreId.toString()) {
      return
    }

    throw new ExamNameTakenError(name)
  }

  /**
   * @param {Exam} exam
   * @returns {void}
   * @throws {ExamNotApprovedError}
   */
  public verifyExamApproved(exam: Exam): void {
    if (!this.examApproveSwitcher.isExamApproved(exam)) {
      throw new ExamNotApprovedError(exam)
    }
  }

  /**
   * @param {Exam} exam
   * @returns {void}
   * @throws {ExamWithoutApprovedQuestionsError}
   */
  public verifyExamHasApprovedQuestions(exam: Exam): void {
    if (!exam.approvedQuestionCount) {
      throw new ExamWithoutApprovedQuestionsError(exam)
    }
  }
}