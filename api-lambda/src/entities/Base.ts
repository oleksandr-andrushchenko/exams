import { AfterLoad, Column, PrimaryColumn } from 'typeorm'
import { ObjectId } from 'bson'
import { IsMongoId, IsNumber, IsOptional } from 'class-validator'
import ObjectIdTransformer from '../database/ObjectIdTransformer'

export default class Base {
  @AfterLoad()
  private removeNullableOwnerId(): void {
    if (this.ownerId == null) {
      delete this.ownerId
    }
  }

  @IsMongoId()
  @PrimaryColumn({ type: 'varchar', length: 24, transformer: ObjectIdTransformer })
  public readonly id: ObjectId = new ObjectId()

  @IsMongoId()
  @Column({ type: 'varchar', length: 24, nullable: true, transformer: ObjectIdTransformer })
  public creatorId: ObjectId

  @IsMongoId()
  @Column({ type: 'varchar', length: 24, nullable: true, transformer: ObjectIdTransformer })
  public ownerId?: ObjectId

  @IsNumber()
  @Column({ type: 'timestamptz', update: false })
  public createdAt: Date

  @IsOptional()
  @IsNumber()
  @Column({ type: 'timestamptz', nullable: true })
  public updatedAt?: Date

  @IsOptional()
  @IsNumber()
  @Column({ type: 'timestamptz', nullable: true })
  public deletedAt?: Date
}
