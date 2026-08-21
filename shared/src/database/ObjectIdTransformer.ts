import { ValueTransformer } from 'typeorm'
import { ObjectId } from 'bson'

const ObjectIdTransformer: ValueTransformer = {
  to: (value?: ObjectId | string): string | undefined => (typeof value === 'string' ? value : value?.toHexString()),
  from: (value?: string): ObjectId | undefined => (value ? new ObjectId(value) : undefined)
}

export default ObjectIdTransformer
