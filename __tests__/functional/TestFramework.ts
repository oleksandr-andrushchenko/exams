import 'reflect-metadata'
import fs from 'node:fs'
import path from 'node:path'
import { Container, ContainerInstance } from 'typedi'
import UserRepository from '../../api-lambda/src/repositories/UserRepository'
import ExamRepository from '../../api-lambda/src/repositories/exam/ExamRepository'
import QuestionRepository from '../../api-lambda/src/repositories/question/QuestionRepository'
import ExamSessionRepository from '../../api-lambda/src/repositories/ExamSessionRepository'
import User from '../../api-lambda/src/entities/user/User'
import { faker } from '@faker-js/faker'
import {
  defaultChoices,
  nextExamName,
  nextQuestionTitle,
  nextPerson,
  nextTagName,
  nextUserCredentials,
  slugify
} from './HumanReadableTestData'
import Permission from '../../api-lambda/src/enums/Permission'
import Exam from '../../api-lambda/src/entities/exam/Exam'
import Question from '../../api-lambda/src/entities/question/Question'
import ExamSession from '../../api-lambda/src/entities/examSession/ExamSession'
import { ConnectionManager } from 'typeorm'
import { createApplication, db, initializeDb, testServerDown } from '../../api-lambda/src/application'
import { ObjectId } from 'bson'
import Token from '../../api-lambda/src/schema/auth/Token'
import express, { Application, Response } from 'express'
import QuestionType from '../../api-lambda/src/entities/question/QuestionType'
import QuestionDifficulty from '../../api-lambda/src/entities/question/QuestionDifficulty'
import QuestionChoice from '../../api-lambda/src/entities/question/QuestionChoice'
import ExamSessionQuestion from '../../api-lambda/src/entities/examSession/ExamSessionQuestion'
import Rating from '../../api-lambda/src/entities/rating/Rating'
import AccessTokenCreator from '../../api-lambda/src/services/auth/AccessTokenCreator'
import Activity from '../../api-lambda/src/entities/activity/Activity'
import ActivityRepository from '../../api-lambda/src/repositories/ActivityRepository'
import ExamEvent from '../../api-lambda/src/enums/exam/ExamEvent'
import EntityRepository from '../../api-lambda/src/repositories/EntityRepository'
import ExamRatingMark from '../../api-lambda/src/entities/exam/ExamRatingMark'
import QuestionRatingMark from '../../api-lambda/src/entities/question/QuestionRatingMark'
import ExamRatingMarkRepository from '../../api-lambda/src/repositories/exam/ExamRatingMarkRepository'
import QuestionRatingMarkRepository from '../../api-lambda/src/repositories/question/QuestionRatingMarkRepository'
import config from '../../api-lambda/src/configuration'

type TestRequest = {
  method: string
  path: string
  field: string
  fields?: string[]
  query?: Record<string, unknown>
  body?: unknown
}

const errorName = (status: number): string =>
  ({
    400: 'BadRequestError',
    401: 'AuthorizationRequiredError',
    403: 'ForbiddenError',
    404: 'NotFoundError',
    409: 'ConflictError'
  })[status] ?? 'InternalServerError'

const normalizeDateFields = (value: unknown, key = ''): unknown => {
  if (value instanceof Date) return value.getTime()
  if (value && typeof value === 'object' && 'toHexString' in value) return value.toString()
  if (typeof value === 'string' && /At$/.test(key)) return Date.parse(value)
  if (Array.isArray(value)) return value.map((item) => normalizeDateFields(item, key))
  if (value && typeof value === 'object') {
    const result = Object.fromEntries(
      Object.entries(value).map(([name, item]) => [name, normalizeDateFields(item, name)])
    )
    if (Array.isArray(result.questions)) {
      result.questionCount = result.questions.length
      result.answeredQuestionCount = result.questions.filter(
        (question: any) => typeof question.choice === 'number' || typeof question.answer === 'string'
      ).length
    }
    if (Array.isArray(result.choices)) {
      result.choices = result.choices.map((choice: any) =>
        choice && typeof choice === 'object' ? { correct: null, explanation: null, ...choice } : choice
      )
    }
    return result
  }
  return value
}

const selectFields = (value: unknown, fields: string[] | undefined): unknown => {
  if (!fields?.length) return value
  if (Array.isArray(value)) return value.map((item) => selectFields(item, fields))
  if (!value || typeof value !== 'object') return value
  const selected = fields.map((field) => field.trim().split(/\s|\{/)[0]).filter(Boolean)
  return Object.fromEntries(selected.filter((field) => field in value).map((field) => [field, value[field]]))
}

const dispatchTestRequest = (
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
): void => {
  const rest = request.body as TestRequest
  if (!rest || typeof rest.path !== 'string' || typeof rest.method !== 'string' || typeof rest.field !== 'string') {
    next()
    return
  }

  request.method = rest.method.toUpperCase()
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(rest.query ?? {})) {
    if (value !== undefined) query.append(key, Array.isArray(value) ? value.join(',') : String(value))
  }
  request.url = rest.path + (query.toString() ? '?' + query.toString() : '')
  Object.defineProperty(request, 'query', { value: rest.query ?? {}, writable: true })
  request.body = rest.body

  const json = response.json.bind(response)
  response.json = ((body: unknown) => {
    if (body && typeof body === 'object' && 'error' in body) {
      const status = response.statusCode
      response.statusCode = 200
      return json({
        errors: [{ message: (body.error as { message?: string }).message, extensions: { name: errorName(status) } }]
      })
    }
    response.statusCode = 200
    const value = body && typeof body === 'object' && 'deleted' in body ? body.deleted : body
    const normalized = normalizeDateFields(value)
    return json({ data: { [rest.field]: selectFields(normalized, rest.fields) } })
  }) as Response['json']

  next()
}

import ExamTag from '../../api-lambda/src/entities/examTag/ExamTag'
import ExamTagRepository from '../../api-lambda/src/repositories/examTag/ExamTagRepository'

const demoImagesDir = path.resolve(process.cwd(), 'static')

const demoImageFilename = (prefix: string): string | undefined => {
  if (!faker.datatype.boolean()) return undefined

  fs.mkdirSync(demoImagesDir, { recursive: true })
  const filename = 'demo-' + prefix + '-' + faker.string.uuid() + '.svg'
  const hue = faker.number.int({ min: 0, max: 360 })
  const content =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="hsl(' +
    hue +
    ' 70% 55%)"/><circle cx="250" cy="35" r="80" fill="rgba(255,255,255,.2)"/><circle cx="55" cy="145" r="100" fill="rgba(0,0,0,.15)"/></svg>'
  fs.writeFileSync(path.join(demoImagesDir, filename), content)
  return filename
}

export default class TestFramework {
  public app: Application

  private readonly container: ContainerInstance
  private readonly _serverUp: () => Promise<Application>
  private readonly _serverDown: () => Promise<void>

  public constructor() {
    this.container = Container as unknown as ContainerInstance
    this._serverUp = async () => {
      await initializeDb(db)
      return await createApplication((app) => {
        app.use(express.json())
        app.post('/', dispatchTestRequest)
      })
    }
    this._serverDown = testServerDown
  }

  public async serverUp(): Promise<void> {
    this.app = await this._serverUp()
  }

  public async serverDown(): Promise<void> {
    await this._serverDown()
  }

  public async clear(
    _entity: any | any[] = [User, Exam, Question, ExamSession, Activity, ExamRatingMark, QuestionRatingMark, ExamTag]
  ): Promise<void> {
    _entity = Array.isArray(_entity) ? _entity : [_entity]

    const schema = config.db.schema
    if (_entity.some((entity) => this.compare(entity, Exam) || this.compare(entity, ExamTag))) {
      await this.container
        .get<ConnectionManager>(ConnectionManager)
        .get('default')
        .manager.query('DELETE FROM \"' + schema + '\".\"examExamTags\"')
    }

    for (const entity of _entity) {
      switch (true) {
        case this.compare(entity, User):
          await this.container.get<UserRepository>(UserRepository).clear()
          break
        case this.compare(entity, Exam):
          await this.container
            .get<ConnectionManager>(ConnectionManager)
            .get('default')
            .manager.query('DELETE FROM \"' + config.db.schema + '\".exams')
          break
        case this.compare(entity, Question):
          await this.container.get<QuestionRepository>(QuestionRepository).clear()
          break
        case this.compare(entity, ExamSession):
          await this.container.get<ExamSessionRepository>(ExamSessionRepository).clear()
          break
        case this.compare(entity, Activity):
          await this.container.get<ActivityRepository>(ActivityRepository).clear()
          break
        case this.compare(entity, ExamRatingMark):
          await this.container.get<ExamRatingMarkRepository>(ExamRatingMarkRepository).clear()
          break
        case this.compare(entity, QuestionRatingMark):
          await this.container.get<QuestionRatingMarkRepository>(QuestionRatingMarkRepository).clear()
          break
        case this.compare(entity, ExamTag):
          await this.container
            .get<ConnectionManager>(ConnectionManager)
            .get('default')
            .manager.query('DELETE FROM \"' + config.db.schema + '\".\"examTags\"')
          break
        default:
          throw new Error(`Clear: Unknown "${entity.toString()}" type passed`)
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
        object.permissions = 'permissions' in options ? options.permissions : [Permission.Regular]
        object.name = 'name' in options ? options.name : nextPerson()
        if ('imageFilename' in options) object.imageFilename = options.imageFilename
        const credentials = nextUserCredentials(object.permissions)
        object.email = 'email' in options ? options.email : credentials.email
        object.password = 'password' in options ? options.password : credentials.password

        break
      case this.compare(entity, Exam):
        object = new Exam()
        object.name = 'name' in options ? options.name : nextExamName()
        if ('imageFilename' in options) object.imageFilename = options.imageFilename
        object.requiredScore =
          'requiredScore' in options
            ? options.requiredScore
            : faker.number.int({
                min: 0,
                max: 100
              })
        object.questionCount = 'questionCount' in options ? options.questionCount : 3
        object.approvedQuestionCount =
          'approvedQuestionCount' in options
            ? options.approvedQuestionCount
            : faker.number.int({
                min: 0,
                max: 2
              })
        object.creatorId = 'creatorId' in options ? options.creatorId : ((await this.fixture(User)) as User).id
        object.ownerId = 'ownerId' in options ? options.ownerId : object.creatorId

        if ('rating' in options) object.rating = options.rating
        if (!('rating' in options) && faker.datatype.boolean()) {
          const rating = new Rating()
          rating.averageMark = faker.number.int({ min: 1, max: 5 })
          rating.markCount = faker.number.int({ min: 1, max: 10 })
          object.rating = rating
        }

        break
      case this.compare(entity, Question):
        object = new Question()
        object.examId = 'examId' in options ? options.examId : ((await this.fixture(Exam)) as Exam).id
        object.type = 'type' in options ? options.type : faker.helpers.enumValue(QuestionType)
        object.difficulty = 'difficulty' in options ? options.difficulty : QuestionDifficulty.MODERATE
        object.title = 'title' in options ? options.title : nextQuestionTitle()
        if ('imageFilename' in options) object.imageFilename = options.imageFilename
        object.creatorId = 'creatorId' in options ? options.creatorId : ((await this.fixture(User)) as User).id
        object.ownerId = 'ownerId' in options ? options.ownerId : object.creatorId

        if (object.type === QuestionType.CHOICE) {
          object.choices = (('choices' in options ? options.choices : defaultChoices()) as any[]).map((choice) => {
            const item = new QuestionChoice()
            Object.assign(item, choice)
            return item
          })
        }

        if ('rating' in options) object.rating = options.rating
        if (!('rating' in options) && faker.datatype.boolean()) {
          const rating = new Rating()
          rating.averageMark = faker.number.int({ min: 1, max: 5 })
          rating.markCount = faker.number.int({ min: 1, max: 10 })
          object.rating = rating
        }

        break
      case this.compare(entity, ExamSession):
        object = new ExamSession()
        object.examId = 'examId' in options ? options.examId : ((await this.fixture(Exam)) as Exam).id
        object.creatorId = 'creatorId' in options ? options.creatorId : ((await this.fixture(User)) as User).id
        object.ownerId = 'ownerId' in options ? options.ownerId : object.creatorId

        const questions = []

        for (let i = 0, max = faker.number.int({ min: 1, max: 3 }); i < max; i++) {
          const question = (await this.fixture(Question, {
            examId: object.examId,
            creatorId: object.creatorId,
            ownerId: object.ownerId
          })) as Question
          const examSessionQuestion = new ExamSessionQuestion()
          examSessionQuestion.questionId = question.id

          if (faker.datatype.boolean()) {
            if (question.type === QuestionType.CHOICE) {
              examSessionQuestion.choice = faker.number.int({ min: 0, max: question.choices.length - 1 })
            }
          }

          questions.push(examSessionQuestion)
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

        if (Object.values(ExamEvent).includes(object.event)) {
          const exam = ('exam' in options ? options.exam : await this.fixture<Exam>(Exam)) as Exam
          object.examId = exam.id
          object.examName = exam.name
        }

        break
      case this.compare(entity, ExamRatingMark):
        object = new ExamRatingMark()
        object.mark = 'mark' in options ? options.mark : faker.number.int({ min: 1, max: 5 })
        object.examId = 'examId' in options ? options.examId : ((await this.fixture(Exam)) as Exam).id
        object.creatorId = 'creatorId' in options ? options.creatorId : ((await this.fixture(User)) as User).id

        break
      case this.compare(entity, QuestionRatingMark):
        object = new QuestionRatingMark()
        object.mark = 'mark' in options ? options.mark : faker.number.int({ min: 1, max: 5 })
        object.questionId =
          'questionId' in options ? options.questionId : ((await this.fixture(Question)) as Question).id
        object.creatorId = 'creatorId' in options ? options.creatorId : ((await this.fixture(User)) as User).id

        break
      case this.compare(entity, ExamTag):
        object = new ExamTag()
        object.name = 'name' in options ? options.name : nextTagName()
        object.slug = 'slug' in options ? options.slug : slugify(object.name)
        object.rating = 'rating' in options ? options.rating : 0

        break
      default:
        throw new Error(`Fixture: Unknown "${entity.toString()}" type passed`)
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

  public repo<Entity>(entity: any): any {
    switch (true) {
      case this.compare(entity, User):
        return this.container.get<UserRepository>(UserRepository) as any
      case this.compare(entity, Exam):
        return this.container.get<ExamRepository>(ExamRepository) as any
      case this.compare(entity, Question):
        return this.container.get<QuestionRepository>(QuestionRepository) as any
      case this.compare(entity, ExamSession):
        return this.container.get<ExamSessionRepository>(ExamSessionRepository) as any
      case this.compare(entity, Activity):
        return this.container.get<ActivityRepository>(ActivityRepository) as any
      case this.compare(entity, ExamRatingMark):
        return this.container.get<ExamRatingMarkRepository>(ExamRatingMarkRepository) as any
      case this.compare(entity, QuestionRatingMark):
        return this.container.get<QuestionRatingMarkRepository>(QuestionRatingMarkRepository) as any
      case this.compare(entity, ExamTag):
        return this.container.get<ExamTagRepository>(ExamTagRepository) as any
      default:
        throw new Error(`Repo: Unknown "${entity.toString()}" type passed`)
    }
  }

  public async load<Entity>(entity: any, id: ObjectId): Promise<Entity> {
    return (await this.repo<Entity>(entity).findOneById(id)) as any
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

  public apiError(...names: string[]) {
    return {
      errors: names.slice(0, 1).map((name) => {
        return { extensions: { name } }
      })
    }
  }

  public async auth(user: User): Promise<Token> {
    const tokenCreator: AccessTokenCreator = this.container.get<AccessTokenCreator>(AccessTokenCreator)

    return await tokenCreator.createAccessToken(user)
  }

  public async seedDemoData(): Promise<void> {
    const seedManager = this.container.get<ConnectionManager>(ConnectionManager).get('default').manager
    if (fs.existsSync(demoImagesDir)) {
      for (const filename of fs.readdirSync(demoImagesDir)) {
        if (filename.startsWith('demo-') && filename.endsWith('.svg')) {
          fs.unlinkSync(path.join(demoImagesDir, filename))
        }
      }
    }

    for (const schema of [config.db.schema]) {
      for (const table of [
        'examExamTags',
        'examRatingMarks',
        'questionRatingMarks',
        'activities',
        'examSessions',
        'questions',
        'exams',
        'examTags',
        'users'
      ]) {
        await seedManager.query('DELETE FROM "' + schema + '"."' + table + '"')
      }
    }
    await this.clear([User, Exam, Question, ExamSession, Activity, ExamRatingMark, QuestionRatingMark, ExamTag])

    const regular = await this.fixture<User>(User, {
      name: 'Demo Learner',
      email: 'learner@examme.test',
      password: 'Learner123!',
      permissions: [Permission.Regular],
      imageFilename: demoImageFilename('user')
    })
    const admin = await this.fixture<User>(User, {
      name: 'Demo Administrator',
      email: 'admin@examme.test',
      password: 'Admin123!',
      permissions: [Permission.All],
      imageFilename: demoImageFilename('user')
    })
    const root = await this.fixture<User>(User, {
      name: 'Demo Root',
      email: 'root@examme.test',
      password: 'Root123!',
      permissions: [Permission.Root],
      imageFilename: demoImageFilename('user')
    })

    const tagData = [
      ['AWS', 'aws'],
      ['Cloud Architecture', 'cloud-architecture'],
      ['Cloud Security', 'cloud-security'],
      ['DevOps', 'devops'],
      ['Kubernetes', 'kubernetes'],
      ['Microsoft Azure', 'microsoft-azure']
    ]
    const tags = await Promise.all(
      tagData.map(([name, slug], index) =>
        this.fixture<ExamTag>(ExamTag, {
          name,
          slug,
          rating: 5 - (index % 3),
          imageFilename: undefined
        })
      )
    )

    const examData = [
      ['AWS Certified Developer Associate', 70, ['aws', 'devops']],
      ['AWS Certified Solutions Architect Professional', 75, ['aws', 'cloud-architecture', 'cloud-security']],
      ['AWS Certified SysOps Administrator Associate', 72, ['aws', 'devops', 'cloud-security']],
      ['Certified Kubernetes Administrator', 70, ['kubernetes', 'devops', 'cloud-architecture']],
      ['Microsoft Azure Administrator Associate', 68, ['microsoft-azure', 'cloud-architecture']]
    ] as const
    const exams: Exam[] = []
    for (const [name, requiredScore] of examData) {
      exams.push(
        await this.fixture<Exam>(Exam, {
          name,
          requiredScore,
          questionCount: 3,
          approvedQuestionCount: 2,
          creatorId: admin.id,
          ownerId: undefined,
          rating: { averageMark: 4, markCount: 24 },
          imageFilename: demoImageFilename('exam')
        })
      )
    }

    const questionTitles = [
      'Which service is best suited for durable object storage?',
      'Which design provides high availability across failure domains?',
      'Which identity approach follows the principle of least privilege?'
    ]
    const questions: Question[] = []
    for (const exam of exams) {
      for (const title of questionTitles) {
        questions.push(
          await this.fixture<Question>(Question, {
            examId: exam.id,
            creatorId: admin.id,
            ownerId: undefined,
            title: `${title} (${exam.name})`,
            difficulty: QuestionDifficulty.MODERATE,
            choices: defaultChoices(),
            imageFilename: demoImageFilename('question')
          })
        )
      }
    }

    for (const question of questions) {
      const marks = await Promise.all(
        [regular, admin, root].map(async (creator) => {
          const mark = faker.number.int({ min: 0, max: 5 })
          await this.fixture<QuestionRatingMark>(QuestionRatingMark, {
            questionId: question.id,
            creatorId: creator.id,
            mark
          })
          return mark
        })
      )
      question.rating = new Rating()
      question.rating.markCount = marks.length
      question.rating.averageMark = marks.reduce((sum, mark) => sum + mark, 0) / marks.length
      await seedManager.save(question)
    }

    for (const exam of exams) {
      const examQuestions = questions.filter((question) => question.examId.toString() === exam.id.toString())
      const marks = examQuestions.flatMap((question) => {
        const rating = question.rating!
        return Array.from({ length: rating.markCount }, () => rating.averageMark)
      })
      exam.rating = new Rating()
      exam.rating.markCount = marks.length
      exam.rating.averageMark = marks.reduce((sum, mark) => sum + mark, 0) / marks.length
      await seedManager.save(exam)
    }

    admin.rating = new Rating()
    admin.rating.markCount = exams.reduce((sum, exam) => sum + (exam.rating?.markCount || 0), 0)
    admin.rating.averageMark = admin.rating.markCount
      ? exams.reduce((sum, exam) => sum + (exam.rating?.averageMark || 0) * (exam.rating?.markCount || 0), 0) /
        admin.rating.markCount
      : 0
    await seedManager.save(admin)

    for (let index = 0; index < exams.length; index++) {
      const exam = exams[index]
      await this.fixture<ExamSession>(ExamSession, {
        examId: exam.id,
        creatorId: regular.id,
        ownerId: regular.id,
        completed: index % 2 === 0
      })
      await this.fixture<Activity>(Activity, {
        exam: exam,
        event: index % 2 === 0 ? ExamEvent.Created : ExamEvent.Approved
      })
      await this.fixture<QuestionRatingMark>(QuestionRatingMark, {
        questionId: questions[index * 3].id,
        creatorId: regular.id,
        mark: 5
      })
    }

    const manager = this.container.get<ConnectionManager>(ConnectionManager).get('default').manager
    for (const [name, _requiredScore, slugs] of examData) {
      const [examRow] = await manager.query('SELECT id FROM \"' + config.db.schema + '\".exams WHERE name = $1', [name])
      for (const slug of slugs) {
        const [tagRow] = await manager.query(
          'SELECT id FROM \"' + config.db.schema + '\".\"examTags\" WHERE slug = $1',
          [slug]
        )
        await manager.query(
          'INSERT INTO \"' + config.db.schema + '\".\"examExamTags\" (\"examId\", \"examTagId\") VALUES ($1, $2)',
          [examRow.id, tagRow.id]
        )
      }
    }

    void root
    void tags
  }

  public async fakeId(): Promise<ObjectId> {
    return ObjectId.createFromTime(Date.now())
  }

  public async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
