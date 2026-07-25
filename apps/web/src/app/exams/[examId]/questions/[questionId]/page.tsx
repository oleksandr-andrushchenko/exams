export const dynamic = 'force-dynamic'

import { renderQuestion } from '../../../../_pages'
export default async function Page({ params }: { params: Promise<{ questionId: string }> }) { return renderQuestion((await params).questionId) }
