import { Inject, Service } from 'typedi'
import { type Request, type Response } from 'express'
import AuthUserProvider from '../../../shared/src/services/auth/AuthUserProvider'
import ExamProvider from '../../../shared/src/services/exam/ExamProvider'
import QuestionProvider from '../../../shared/src/services/question/QuestionProvider'
import TagRepository from '../../../shared/src/repositories/questions/TagRepository'
import UserRepository from '../../../shared/src/repositories/users/UserRepository'

@Service()
export default class HomeController {
  public constructor(
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly questionProvider: QuestionProvider,
    @Inject() private readonly tagRepository: TagRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly authUserProvider: AuthUserProvider
  ) {
  }

  public async getHome(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getAuthUser(request)
    const [ tags, exams, popularExams, questions, popularQuestions, popularUsers ] = await Promise.all([
      this.tagRepository.getExamTags(8),
      this.examProvider.getExams(8, user),
      this.examProvider.getPopularExams(8, user),
      this.questionProvider.getQuestions(8, user),
      this.questionProvider.getPopularQuestions(8, user),
      this.userRepository.getPopularUsers(8)
    ])
    response.render('home.html', {
      data: { tags, exams, popularExams, questions, popularQuestions, popularUsers },
      title: 'Home'
    })
  }
}
