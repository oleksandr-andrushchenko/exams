import { Container, ContainerInstance } from 'typedi'
import UserRepository from '../../src/repositories/UserRepository'
import CategoryRepository from '../../src/repositories/category/CategoryRepository'
import QuestionRepository from '../../src/repositories/question/QuestionRepository'
import ExamRepository from '../../src/repositories/ExamRepository'
import User from '../../src/entities/user/User'
import { faker } from '@faker-js/faker'
import Permission from '../../src/enums/Permission'
import Category from '../../src/entities/category/Category'
import Question from '../../src/entities/question/Question'
import Exam from '../../src/entities/exam/Exam'
import { ConnectionManager } from 'typeorm'
import { ObjectId } from 'mongodb'
import Token from '../../src/schema/auth/Token'
import { Application } from 'express'
import QuestionType from '../../src/entities/question/QuestionType'
import QuestionDifficulty from '../../src/entities/question/QuestionDifficulty'
import QuestionChoice from '../../src/entities/question/QuestionChoice'
import ExamQuestion from '../../src/entities/exam/ExamQuestion'
import Rating from '../../src/entities/rating/Rating'
import AccessTokenCreator from '../../src/services/auth/AccessTokenCreator'
import Activity from '../../src/entities/activity/Activity'
import ActivityRepository from '../../src/repositories/ActivityRepository'
import CategoryEvent from '../../src/enums/category/CategoryEvent'
import EntityRepository from '../../src/repositories/EntityRepository'
import CategoryRatingMark from '../../src/entities/category/CategoryRatingMark'
import QuestionRatingMark from '../../src/entities/question/QuestionRatingMark'
import CategoryRatingMarkRepository from '../../src/repositories/category/CategoryRatingMarkRepository'
import QuestionRatingMarkRepository from '../../src/repositories/question/QuestionRatingMarkRepository'

export default class TestFramework {
  public app: Application

  private readonly container: ContainerInstance
  private readonly _serverUp: () => Promise<Application>
  private readonly _serverDown: () => Promise<void>

  public constructor() {
    const { testServerUp, testServerDown } = require('../../src/application')
    this.container = Container as unknown as ContainerInstance
    this._serverUp = testServerUp
    this._serverDown = testServerDown
  }

  public async serverUp(): Promise<void> {
    this.app = await this._serverUp()
  }

  public async serverDown(): Promise<void> {
    await this._serverDown()
  }

  public async clear(_entity: any | any[] = [ User, Category, Question, Exam, CategoryRatingMark, QuestionRatingMark ]): Promise<void> {
    _entity = Array.isArray(_entity) ? _entity : [ _entity ]

    for (const entity of _entity) {
      switch (true) {
        case this.compare(entity, User):
          await this.container.get<UserRepository>(UserRepository).clear()
          break
        case this.compare(entity, Category):
          await this.container.get<CategoryRepository>(CategoryRepository).clear()
          break
        case this.compare(entity, Question):
          await this.container.get<QuestionRepository>(QuestionRepository).clear()
          break
        case this.compare(entity, Exam):
          await this.container.get<ExamRepository>(ExamRepository).clear()
          break
        case this.compare(entity, Activity):
          await this.container.get<ActivityRepository>(ActivityRepository).clear()
          break
        case this.compare(entity, CategoryRatingMark):
          await this.container.get<CategoryRatingMarkRepository>(CategoryRatingMarkRepository).clear()
          break
        case this.compare(entity, QuestionRatingMark):
          await this.container.get<QuestionRatingMarkRepository>(QuestionRatingMarkRepository).clear()
          break
        default:
          throw new Error(`Clear: Unknown "${ entity.toString() }" type passed`)
      }
    }
  }

  public compare(entity1: any, entity2: any): boolean {
    return entity1.name === entity2.name
  }

  public async fixture<Entity>(entity: any, options: object = {}): Promise<Entity> {
    let object: any

    switch (true) {
      case this.compare(entity, User):
        object = new User()
        object.name = faker.person.fullName()
        object.email = faker.internet.email()
        object.password = 'password' in options ? options.password : faker.internet.password()
        object.permissions = 'permissions' in options ? options.permissions : [ Permission.Regular ]

        break
      case this.compare(entity, Category):
        object = new Category()
        object.name = faker.lorem.word()
        object.requiredScore = 'requiredScore' in options ? options.requiredScore : faker.number.int({
          min: 0,
          max: 100,
        })
        object.questionCount = 'questionCount' in options ? options.questionCount : faker.number.int({ min: 2, max: 5 })
        object.approvedQuestionCount = 'approvedQuestionCount' in options ? options.approvedQuestionCount : faker.number.int({
          min: 0,
          max: 2,
        })
        object.creatorId = 'creatorId' in options ? options.creatorId : (await this.fixture(User) as User).id
        object.ownerId = 'ownerId' in options ? options.ownerId : object.creatorId

        if (faker.datatype.boolean()) {
          const rating = new Rating()
          rating.averageMark = faker.number.int({ min: 1, max: 5 })
          rating.markCount = faker.number.int({ min: 1, max: 10 })
          object.rating = rating
        }

        break
      case this.compare(entity, Question):
        object = new Question()
        object.categoryId = 'categoryId' in options ? options.categoryId : (await this.fixture(Category) as Category).id
        object.type = 'type' in options ? options.type : faker.helpers.enumValue(QuestionType)
        object.difficulty = faker.helpers.enumValue(QuestionDifficulty)
        object.title = faker.lorem.sentences(3)
        object.creatorId = 'creatorId' in options ? options.creatorId : (await this.fixture(User) as User).id
        object.ownerId = 'ownerId' in options ? options.ownerId : object.creatorId

        if (object.type === QuestionType.CHOICE) {
          const choices = []

          for (let i = 0, max = faker.number.int({ min: 1, max: 3 }); i < max; i++) {
            const choice = new QuestionChoice()
            choice.title = faker.lorem.word()

            if (faker.datatype.boolean()) {
              choice.correct = true
            }

            if (faker.datatype.boolean()) {
              choice.explanation = faker.lorem.sentence()
            }

            choices.push(choice)
          }

          object.choices = choices
        }

        if (faker.datatype.boolean()) {
          const rating = new Rating()
          rating.averageMark = faker.number.int({ min: 1, max: 5 })
          rating.markCount = faker.number.int({ min: 1, max: 10 })
          object.rating = rating
        }

        break
      case this.compare(entity, Exam):
        object = new Exam()
        object.categoryId = 'categoryId' in options ? options.categoryId : (await this.fixture(Category) as Category).id
        object.creatorId = 'creatorId' in options ? options.creatorId : (await this.fixture(User) as User).id
        object.ownerId = 'ownerId' in options ? options.ownerId : object.creatorId

        const questions = []

        for (let i = 0, max = faker.number.int({ min: 1, max: 3 }); i < max; i++) {
          const question = await this.fixture(Question, { categoryId: object.categoryId }) as Question
          const examQuestion = new ExamQuestion()
          examQuestion.questionId = question.id

          if (faker.datatype.boolean()) {
            if (question.type === QuestionType.CHOICE) {
              examQuestion.choice = faker.number.int({ min: 0, max: question.choices.length - 1 })
            }
          }

          questions.push(examQuestion)
        }

        object.questions = questions
        object.questionNumber = faker.number.int({ min: 0, max: questions.length - 1 })

        if (options['completed'] ?? faker.datatype.boolean()) {
          object.correctAnswerCount = faker.number.int({ min: 0, max: questions.length })
          object.completedAt = faker.date.anytime()
        }

        break
      case this.compare(entity, Activity):
        object = new Activity()
        object.event = 'event' in options ? options.event : faker.helpers.arrayElement(Object.values(Event))

        if (Object.values(CategoryEvent).includes(object.event)) {
          const category = ('category' in options ? options.category : await this.fixture<Category>(Category)) as Category
          object.categoryId = category.id
          object.categoryName = category.name
        }

        break
      case this.compare(entity, CategoryRatingMark):
        object = new CategoryRatingMark()
        object.mark = 'mark' in options ? options.mark : faker.number.int({ min: 1, max: 5 })
        object.categoryId = 'categoryId' in options ? options.categoryId : (await this.fixture(Category) as Category).id
        object.creatorId = 'creatorId' in options ? options.creatorId : (await this.fixture(User) as User).id

        break
      case this.compare(entity, QuestionRatingMark):
        object = new QuestionRatingMark()
        object.mark = 'mark' in options ? options.mark : faker.number.int({ min: 1, max: 5 })
        object.questionId = 'questionId' in options ? options.questionId : (await this.fixture(Question) as Question).id
        object.creatorId = 'creatorId' in options ? options.creatorId : (await this.fixture(User) as User).id

        break
      default:
        throw new Error(`Fixture: Unknown "${ entity.toString() }" type passed`)
    }

    object.createdAt = faker.date.anytime()

    if (faker.datatype.boolean()) {
      object.updatedAt = faker.date.anytime()
    }

    if (options['deleted'] ?? false) {
      object.deletedAt = faker.date.anytime()
    }

    if (object.ownerId === undefined) {
      delete object.ownerId
    }

    await this.container.get<ConnectionManager>(ConnectionManager).get('default').manager.save(object)

    return object
  }

  public repo<Entity>(entity: any): EntityRepository<Entity> {
    switch (true) {
      case this.compare(entity, User):
        return this.container.get<UserRepository>(UserRepository) as any
      case this.compare(entity, Category):
        return this.container.get<CategoryRepository>(CategoryRepository) as any
      case this.compare(entity, Question):
        return this.container.get<QuestionRepository>(QuestionRepository) as any
      case this.compare(entity, Exam):
        return this.container.get<ExamRepository>(ExamRepository) as any
      case this.compare(entity, Activity):
        return this.container.get<ActivityRepository>(ActivityRepository) as any
      case this.compare(entity, CategoryRatingMark):
        return this.container.get<CategoryRatingMarkRepository>(CategoryRatingMarkRepository) as any
      case this.compare(entity, QuestionRatingMark):
        return this.container.get<QuestionRatingMarkRepository>(QuestionRatingMarkRepository) as any
      default:
        throw new Error(`Repo: Unknown "${ entity.toString() }" type passed`)
    }
  }

  public async load<Entity>(entity: any, id: ObjectId): Promise<Entity> {
    return await (this.repo<Entity>(entity)).findOneById(id) as any
  }

  public error(name: string = '', message: string = '', errors: string[] = []): object {
    const body = {}

    if (name) {
      body['name'] = name
    }

    if (message) {
      body['message'] = message
    }

    if (errors.length > 0) {
      body['errors'] = errors
    }

    return body
  }

  public graphqlError(...names: string[]) {
    return {
      errors: names.map(name => {
        return { extensions: { name } }
      }),
    }
  }

  public async auth(user: User): Promise<Token> {
    const tokenCreator: AccessTokenCreator = this.container.get<AccessTokenCreator>(AccessTokenCreator)

    return await tokenCreator.createAccessToken(user)
  }

  public async fakeId(): Promise<ObjectId> {
    return ObjectId.createFromTime(Date.now())
  }

  public async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}