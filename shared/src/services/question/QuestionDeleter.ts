import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import Question from '../../entities/question/Question'
import ExamProvider from '../exam/ExamProvider'
import QuestionPermission from '../../enums/question/QuestionPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import QuestionRepository from '../../repositories/questions/QuestionRepository'
import ExamRepository from '../../repositories/exams/ExamRepository'
import EventDispatcher from '../event/EventDispatcher'
import QuestionEvent from '../../enums/question/QuestionEvent'

@Service()
export default class QuestionDeleter {
  public constructor(
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject() private readonly examRepository: ExamRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier
  ) {}

  /**
   * @param {Question} question
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {QuestionNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async deleteQuestion(question: Question, initiator: User): Promise<Question> {
    await this.authorizationVerifier.verifyAuthorization(initiator, QuestionPermission.Delete, question)

    const exam = await this.examProvider.getExam(question.examId.toString())

    await this.questionRepository.updateOneByEntity(question, { deletedAt: new Date() })

    const newQuestionCount = Math.max(0, (await this.questionRepository.countByExam(exam)) - 1)
    await this.examRepository.updateOneByEntity(exam, {
      questionCount: newQuestionCount === 0 ? undefined : newQuestionCount,
      updatedAt: new Date()
    })

    await this.eventDispatcher.dispatch(QuestionEvent.Deleted, { question })

    return question
  }
}
