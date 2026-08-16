import { ValueTransformer } from 'typeorm'
import { ObjectId } from 'bson'

const ObjectIdTransformer: ValueTransformer = {
  to: (value?: ObjectId): string | undefined => value?.toHexString(),
  from: (value?: string): ObjectId | undefined => (value ? new ObjectId(value) : undefined)
}

export default ObjectIdTransformer
