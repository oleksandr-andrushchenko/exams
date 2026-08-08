import { ValueTransformer } from 'typeorm'
import { ObjectId } from 'bson'

const transform = (value: any, serialize: boolean): any => {
  if (value == null) return value
  if (value instanceof ObjectId) return serialize ? value.toHexString() : value
  if (!serialize && typeof value === 'string' && ObjectId.isValid(value)) return new ObjectId(value)
  if (Array.isArray(value)) return value.map((item) => transform(item, serialize))
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, transform(item, serialize)]))
  }
  return value
}

const ObjectIdJsonTransformer: ValueTransformer = {
  to: (value) => transform(value, true),
  from: (value) => transform(value, false)
}

export default ObjectIdJsonTransformer
