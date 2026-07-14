import QuestionRatingMark from '../../entities/question/QuestionRatingMark'
import EntityRepository from '../EntityRepository'
import Repository from '../../decorators/Repository'
import Question from '../../entities/question/Question'
import User from '../../entities/user/User'

@Repository(QuestionRatingMark)
export default class QuestionRatingMarkRepository extends EntityRepository<QuestionRatingMark> {

  public async countByQuestion(question: Question): Promise<number> {
    return await this.countBy({ questionId: question.id })
  }

  public async sumByQuestion(question: Question): Promise<number> {
    return await this.sumBy('mark', { questionId: question.id })
  }

  public async findByCreator(creator: User): Promise<QuestionRatingMark[]> {
    return await this.findBy({ creatorId: creator.id })
  }

  public async findByCategoriesAndCreator(categories: Question[], creator: User): Promise<QuestionRatingMark[]> {
    return await this.findBy({
      questionId: { $in: categories.map(question => question.id) },
      creatorId: creator.id,
    })
  }

  public async findOneByQuestionAndCreator(question: Question, creator: User): Promise<QuestionRatingMark | null> {
    return await this.findOneBy({
      questionId: question.id,
      creatorId: creator.id,
    })
  }
}