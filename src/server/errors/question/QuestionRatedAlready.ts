import Question from '../../entities/question/Question'

export default class QuestionRatedAlready extends Error {

  public constructor(question: Question) {
    super(`Question "${ question.title }" is already marked`)
  }
}