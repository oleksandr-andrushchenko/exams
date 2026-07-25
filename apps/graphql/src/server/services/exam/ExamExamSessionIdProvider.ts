import { Service } from 'typedi'
import Exam from '../../entities/exam/Exam'
import User from '../../entities/user/User'
import { ObjectId } from 'bson'

@Service()
export default class ExamExamSessionIdProvider {

  public getExamExamSessionId(exam: Exam, initiator: User): ObjectId | undefined {
    const examIdExamSessionIds = initiator.examExamSessions

    if (!examIdExamSessionIds) {
      return undefined
    }

    const examIdKey = exam.id.toString()

    if (examIdKey in examIdExamSessionIds) {
      if (typeof examIdExamSessionIds[examIdKey] === 'string') {
        return new ObjectId(examIdExamSessionIds[examIdKey])
      }

      return examIdExamSessionIds[examIdKey]
    }

    return undefined
  }
}