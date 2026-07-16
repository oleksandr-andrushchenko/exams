export default function createListFromObjects<T extends object>(
  items: T[],
  keyProp: keyof T = 'id' as keyof T,
  labelProp: keyof T = 'name' as keyof T,
): Record<string, T[keyof T]> {
  return items.reduce<Record<string, T[keyof T]>>((acc, item) => {
    acc[String(item[keyProp])] = item[labelProp]

    return acc
  }, {})
}