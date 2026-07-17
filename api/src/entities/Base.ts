import { AfterLoad, Column, PrimaryColumn } from 'typeorm'
import { ObjectId } from 'bson'
import { IsMongoId, IsNumber, IsOptional } from 'class-validator'
import { Field, ObjectType } from 'type-graphql'
import { GraphQLTimestamp } from 'graphql-scalars'
import { ObjectIdScalar } from '../scalars/ObjectIdScalar'
import ObjectIdTransformer from '../database/ObjectIdTransformer'

@ObjectType()
export default class Base {
  @AfterLoad()
  private removeNullableOwnerId(): void {
    if (this.ownerId == null) {
      delete this.ownerId
    }
  }

  @IsMongoId()
  @PrimaryColumn({ type: 'varchar', length: 24, transformer: ObjectIdTransformer })
  @Field(_type => ObjectIdScalar)
  public readonly id: ObjectId = new ObjectId()

  @IsMongoId()
  @Column({ type: 'varchar', length: 24, nullable: true, transformer: ObjectIdTransformer })
  public creatorId: ObjectId

  @IsMongoId()
  @Column({ type: 'varchar', length: 24, nullable: true, transformer: ObjectIdTransformer })
  @Field(_type => ObjectIdScalar, { nullable: true })
  public ownerId?: ObjectId

  @IsNumber()
  @Column({ type: 'timestamptz', update: false })
  @Field(_type => GraphQLTimestamp)
  public createdAt: Date

  @IsOptional()
  @IsNumber()
  @Column({ type: 'timestamptz', nullable: true })
  @Field(_type => GraphQLTimestamp, { nullable: true })
  public updatedAt?: Date

  @IsOptional()
  @IsNumber()
  @Column({ type: 'timestamptz', nullable: true })
  public deletedAt?: Date
}
