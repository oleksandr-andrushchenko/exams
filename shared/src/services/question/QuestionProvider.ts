import { Inject, Service } from 'typedi'
import { ObjectId } from 'bson'
import Question from '../../entities/question/Question'
import QuestionRepository from '../../repositories/questions/QuestionRepository'
import QuestionNotFoundError from '../../errors/question/QuestionNotFoundError'
import UserRepository from "../../repositories/users/UserRepository";
import ExamRepository from "../../repositories/exams/ExamRepository";

@Service()
export default class QuestionProvider {
  public constructor(
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly examRepository: ExamRepository,
  ) {
  }

  public async getQuestion(id: ObjectId | string): Promise<Question> {
    const question = await this.questionRepository.findOneById(id)
    if (!question) {
      throw new QuestionNotFoundError(id)
    }
    return await this.decorateQuestion(question)
  }

  public async getQuestionBySlugs(_userSlug: string, _examSlug: string, slug: string): Promise<Question> {
    const question = await this.questionRepository.findOneBySlug(slug)
    if (!question) {
      throw new QuestionNotFoundError(slug)
    }
    return await this.decorateQuestion(question)
  }

  private async decorateQuestion(question: Question): Promise<Question> {
    const creator = await this.userRepository.findOneById(question.creatorId)
    const exam = await this.examRepository.findOneById(question.examId)
    const examCreator = exam ? await this.userRepository.findOneById(exam.creatorId) : undefined
    return Object.assign(question, {
      creator,
      userSlug: creator?.slug,
      exam: Object.assign(exam, {
        userSlug: examCreator?.slug,
      }),
    })
  }

  private async decorateQuestions(questions: Question[]): Promise<Question[]> {
    return Promise.all(questions.map((question) => this.decorateQuestion(question)))
  }

  public async getLastQuestions(): Promise<Question[]> {
    const questions = await this.questionRepository.findLastQuestions()
    return await this.decorateQuestions(questions)
  }

  public async getPopularQuestions(): Promise<Question[]> {
    const questions = await this.questionRepository.findPopularQuestions()
    return await this.decorateQuestions(questions)
  }
}
