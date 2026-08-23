import { Inject, Service } from 'typedi'
import { type Request, type Response } from 'express'
import ExamTagRepository from "../../../shared/src/repositories/exams/ExamTagRepository";
import UserRepository from '../../../shared/src/repositories/users/UserRepository'
import ExamProvider from "../../../shared/src/services/exam/ExamProvider";
import QuestionProvider from "../../../shared/src/services/question/QuestionProvider";

@Service()
export default class HomeController {
  public constructor(
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly questionProvider: QuestionProvider,
    @Inject() private readonly examTagRepository: ExamTagRepository,
    @Inject() private readonly userRepository: UserRepository,
  ) {
  }

  public async showHome(_request: Request, response: Response): Promise<void> {
    const [
      popularTags,
      lastExams,
      popularExams,
      lastQuestions,
      popularQuestions,
      popularUsers,
    ] = await Promise.all([
      this.examTagRepository.findPopularExamTags(),
      this.examProvider.getLastExams(),
      this.examProvider.getPopularExams(),
      this.questionProvider.getLastQuestions(),
      this.questionProvider.getPopularQuestions(),
      this.userRepository.findPopularUsers()
    ])
    response.render('home.html', {
      popularTags,
      lastExams,
      popularExams,
      lastQuestions,
      popularQuestions,
      popularUsers,
      title: 'Home'
    })
  }
}
