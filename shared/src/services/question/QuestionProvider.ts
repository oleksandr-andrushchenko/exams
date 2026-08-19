import { Inject, Service } from 'typedi'
import { ObjectId } from 'bson'
import ValidatorInterface from '../validator/ValidatorInterface'
import Question from '../../entities/question/Question'
import QuestionRepository from '../../repositories/questions/QuestionRepository'
import QuestionNotFoundError from '../../errors/question/QuestionNotFoundError'
import User from '../../entities/user/User'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import QuestionPermission from '../../enums/question/QuestionPermission'

@Service()
export default class QuestionProvider {
  public constructor(
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier
  ) {}

  private async canViewUnapproved(user?: User): Promise<boolean> {
    return !user || this.authorizationVerifier.hasAuthorization(user, QuestionPermission.Get)
  }

  public async getQuestion(id: ObjectId | string, user?: User): Promise<Question> {
    const value = id.toString()
    if (typeof id === 'string' && ObjectId.isValid(id)) this.validator.validateId(id)

    const question = await this.questionRepository.getQuestion(value)
    if (!question || (question.ownerId && !(await this.canViewUnapproved(user)))) {
      throw new QuestionNotFoundError(id)
    }
    return question
  }

  public async getQuestions(size = 50, user?: User): Promise<Question[]> {
    const questions = await this.questionRepository.getQuestions(size)
    return (await this.canViewUnapproved(user)) ? questions : questions.filter((question) => !question.ownerId)
  }

  public async getPopularQuestions(size = 50, user?: User): Promise<Question[]> {
    return this.getQuestions(size, user)
  }

  public async getQuestionList(filters: Record<string, unknown> = {}, user?: User): Promise<Record<string, unknown>> {
    const page = typeof filters.page === 'number' ? Math.max(1, filters.page) : 1
    const size = typeof filters.size === 'number' ? Math.min(50, Math.max(1, filters.size)) : 20
    const questions = await this.getQuestions(page * size + 1, user)
    return {
      data: questions.slice((page - 1) * size, page * size),
      page,
      size,
      hasNext: questions.length > page * size
    }
  }
}
