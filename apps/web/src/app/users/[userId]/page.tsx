export const dynamic = 'force-dynamic'

import { renderUser } from '../../_pages'
export default async function Page({ params }: { params: Promise<{ userId: string }> }) { return renderUser((await params).userId) }
