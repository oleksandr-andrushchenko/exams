export const dynamic = 'force-dynamic'

import { renderExam } from '../../_pages'
export default async function Page({ params }: { params: Promise<{ examId: string }> }) { return renderExam((await params).examId) }
