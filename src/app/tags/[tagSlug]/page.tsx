export const dynamic = 'force-dynamic'

import { renderTag } from '../../_pages'
export default async function Page({ params }: { params: Promise<{ tagSlug: string }> }) { return renderTag((await params).tagSlug) }
