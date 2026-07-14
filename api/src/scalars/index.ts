import { GraphQLTimestamp } from 'graphql-scalars'
import { ObjectIdScalar } from './ObjectIdScalar'
import { ObjectId } from 'mongodb'

export const scalars = [
  { type: ObjectId, scalar: ObjectIdScalar },
  { type: Date, scalar: GraphQLTimestamp },
]