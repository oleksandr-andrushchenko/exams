import { Chip } from '@/components/bootstrap'
import ExamTag from '../../schema/examTag/ExamTag'
import Route from '../../enum/Route'
import Link from '../elements/Link'

export default function ExamTags({tags = []}: { tags?: ExamTag[] }) {
  if (!tags.length) return <span className="text-secondary">—</span>
  return <div className="d-flex flex-wrap gap-1">
    {tags.map(tag => <Link
            key={tag.id || tag.slug}
            to={Route.ExamTag.replace(':tagSlug', tag.slug)}
            tooltip={`View ${tag.examsCount} exam${tag.examsCount === 1 ? '' : 's'} tagged ${tag.name}`}
            label={<Chip value={tag.name} className=" fw-normal"/>}
    />)}
  </div>
}
