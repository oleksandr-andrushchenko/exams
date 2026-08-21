export default function isObjectId(value: string): boolean {
  return /^[0-9a-f]{24}$/i.test(value)
}
