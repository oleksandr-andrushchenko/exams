import Pagination from '../pagination/Pagination'
import YesNo from '../../enum/YesNo'

export default interface GetExams extends Pagination {
  subscription?: YesNo
  approved?: YesNo
  search?: string
  tag?: string
  userId?: string
}