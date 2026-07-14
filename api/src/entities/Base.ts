import { Column, ObjectIdColumn } from 'typeorm'
import { ObjectId } from 'mongodb'
import { IsMongoId, IsNumber, IsOptional } from 'class-validator'
import { Field, ObjectType } from 'type-graphql'
import { GraphQLTimestamp } from 'graphql-scalars'
import { ObjectIdScalar } from '../scalars/ObjectIdScalar'

@ObjectType()
export default class Base {

  @IsMongoId()
  @ObjectIdColumn()
  @Field(_type => ObjectIdScalar)
  public readonly id: ObjectId

  @IsMongoId()
  @Column()
  public creatorId: ObjectId

  @IsMongoId()
  @Column()
  @Field(_type => ObjectIdScalar, { nullable: true })
  public ownerId?: ObjectId

  @IsNumber()
  @Column({ update: false })
  @Field(_type => GraphQLTimestamp)
  public createdAt: Date

  @IsOptional()
  @IsNumber()
  @Column({ insert: false })
  @Field(_type => GraphQLTimestamp, { nullable: true })
  public updatedAt?: Date

  @IsOptional()
  @IsNumber()
  @Column({ insert: false })
  public deletedAt?: Date
}
