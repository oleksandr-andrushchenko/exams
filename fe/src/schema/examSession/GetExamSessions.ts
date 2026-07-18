import Pagination from '../pagination/Pagination'

export default interface GetExamSessions extends Pagination {
  examId?: string
  completion?: boolean
}