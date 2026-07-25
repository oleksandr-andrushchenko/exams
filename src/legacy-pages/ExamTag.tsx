import { useParams } from 'react-router-dom'
import Exams from './Exams'

export default function ExamTag() {
  const { tagSlug = '' } = useParams<{ tagSlug: string }>()
  return <Exams tagSlug={ tagSlug }/>
}
