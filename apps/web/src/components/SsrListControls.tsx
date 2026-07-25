import Link from 'next/link'

type Props = { filters: Record<string, string>; options?: Record<string, Array<{ value: string; label: string }>>; page: number; size: number; hasNext: boolean }

function pageHref(filters: Record<string, string>, page: number) {
  const params = new URLSearchParams(filters)
  params.set('page', String(page))
  return `?${params.toString()}`
}

export default function SsrListControls({ filters, options = {}, page, size, hasNext }: Props) {
  return <>
    <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow">
      <label className="min-w-[220px] flex-1 text-sm">Search<input name="search" defaultValue={filters.search || ''} placeholder="Search..." className="mt-1 w-full rounded border px-3 py-2" /></label>
      {Object.entries(options).map(([name, values]) => <label key={name} className="min-w-[170px] text-sm capitalize">{name}<select name={name} defaultValue={filters[name] || ''} className="mt-1 w-full rounded border px-3 py-2"><option value="">All</option>{values.map(value => <option key={value.value} value={value.value}>{value.label}</option>)}</select></label>)}
      <label className="text-sm">Sort<select name="sort" defaultValue={filters.sort || ''} className="mt-1 rounded border px-3 py-2"><option value="">Newest</option><option value="name">Name</option><option value="createdAt">Created</option></select></label>
      <label className="text-sm">Order<select name="order" defaultValue={filters.order || 'desc'} className="mt-1 rounded border px-3 py-2"><option value="desc">Descending</option><option value="asc">Ascending</option></select></label>
      <label className="text-sm">Size<select name="size" defaultValue={String(size)} className="mt-1 rounded border px-3 py-2">{[10, 20, 30, 50].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button type="submit" className="rounded bg-blue-gray-800 px-4 py-2 text-white">Apply</button>
      <Link href="." className="rounded border px-4 py-2">Clear</Link>
    </form>
    <div className="mt-4 flex items-center justify-between text-sm"><span>Page {page}</span><div className="flex gap-2">{page > 1 && <Link className="rounded border px-3 py-1" href={pageHref(filters, page - 1)}>Previous</Link>}{hasNext && <Link className="rounded border px-3 py-1" href={pageHref(filters, page + 1)}>Next</Link>}</div></div>
  </>
}
