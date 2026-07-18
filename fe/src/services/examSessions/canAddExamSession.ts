import Exam from '../../schema/exam/Exam'

/**
 * @param {Exam} exam
 * @returns {boolean}
 */
export default function canAddExamSession(exam: Exam): boolean {
  if (!exam.isApproved) {
    return false
  }

  if ((exam.approvedQuestionCount ?? 0) === 0) {
    return false
  }

  return true
}