import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import Exam from '../../entities/exam/Exam'
import ExamQuestionSchema from '../../schema/exam/ExamQuestionSchema'
import QuestionProvider from '../question/QuestionProvider'
import ExamQuestionNumberNotFoundError from '../../errors/exam/ExamQuestionNumberNotFoundError'
import ExamPermission from '../../enums/exam/ExamPermission'
import QuestionType from '../../entities/question/QuestionType'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamQuestionProvider {

  public constructor(
    @Inject() private readonly questionProvider: QuestionProvider,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Exam} exam
   * @param {number} questionNumber
   * @param {User} initiator
   * @returns {Promise<ExamQuestionSchema>}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionNotFoundError}
   * @throws {ExamQuestionNumberNotFoundError}
   */
  public async getExamQuestion(exam: Exam, questionNumber: number, initiator: User): Promise<ExamQuestionSchema> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.GetQuestion, exam)

    const questions = exam.questions

    if (typeof questions[questionNumber] === 'undefined') {
      throw new ExamQuestionNumberNotFoundError(questionNumber)
    }

    const question = await this.questionProvider.getQuestion(questions[questionNumber].questionId)

    const examQuestion = new ExamQuestionSchema()
    examQuestion.exam = exam
    examQuestion.question = question
    examQuestion.number = questionNumber

    if (question.type === QuestionType.CHOICE) {
      examQuestion.choice = questions[questionNumber].choice
      examQuestion.choices = question.choices.map(choice => choice.title)
    }

    return examQuestion
  }
}