export default function slugify(value: string | undefined, fallback: string): string {
  const slug = (value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return slug || fallback
}
