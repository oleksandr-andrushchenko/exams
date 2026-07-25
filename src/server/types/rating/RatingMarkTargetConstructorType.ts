import { RatingMarkTargetType } from './RatingMarkTargetType'

type ConstructorOf<T> = T extends { constructor: infer U } ? U : never;

export type RatingMarkTargetConstructorType = ConstructorOf<RatingMarkTargetType>;