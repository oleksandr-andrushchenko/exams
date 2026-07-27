import Link from 'next/link'

type Props = {
  filters: Record<string, string>;
  options?: Record<string, Array<{ value: string; label: string }>>;
  page: number;
  size: number;
  hasNext: boolean
}

function pageHref(filters: Record<string, string>, page: number) {
  const params = new URLSearchParams(filters)
  params.set('page', String(page))
  return `?${params.toString()}`
}

export default function SsrListControls({filters, options = {}, page, size, hasNext}: Props) {
  return <>
    <form method="get" className="card mt-4">
      <div className="card-body d-flex flex-wrap align-items-end gap-3">
        <label className="flex-grow-1 small">Search<input name="search" defaultValue={filters.search || ''}
                                                          placeholder="Search..."
                                                          className="form-control mt-1"/></label>
        {Object.entries(options).map(([name, values]) => <label key={name}
                                                                className="small text-capitalize">{name}<select
                name={name} defaultValue={filters[name] || ''} className="form-select mt-1">
          <option value="">All</option>
          {values.map(value => <option key={value.value} value={value.value}>{value.label}</option>)}</select></label>)}
        <label className="small">Sort<select name="sort" defaultValue={filters.sort || ''} className="form-select mt-1">
          <option value="">Newest</option>
          <option value="name">Name</option>
          <option value="createdAt">Created</option>
        </select></label>
        <label className="small">Order<select name="order" defaultValue={filters.order || 'desc'}
                                              className="form-select mt-1">
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select></label>
        <label className="small">Size<select name="size" defaultValue={String(size)}
                                             className="form-select mt-1">{[10, 20, 30, 50].map(value => <option
                key={value} value={value}>{value}</option>)}</select></label>
        <button type="submit" className="btn btn-secondary">Apply</button>
        <Link href="." className="btn btn-outline-secondary">Clear</Link>
      </div>
    </form>
    <div className="mt-4 d-flex align-items-center justify-content-between small"><span>Page {page}</span>
      <div className="d-flex gap-2">{page > 1 && <Link className="btn btn-outline-secondary btn-sm"
                                                       href={pageHref(filters, page - 1)}>Previous</Link>}{hasNext &&
              <Link className="btn btn-outline-secondary btn-sm" href={pageHref(filters, page + 1)}>Next</Link>}</div>
    </div>
  </>
}
