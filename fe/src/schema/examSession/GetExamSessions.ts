import Pagination from '../pagination/Pagination'

export default interface GetExamSessions extends Pagination {
  userId?: string
  examId?: string
  completion?: boolean
}
