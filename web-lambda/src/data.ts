import { Pool, QueryResultRow } from 'pg'

export type WebRating = { averageMark?: number; markCount?: number }
export type WebExam = {
  id: string
  slug: string
  userSlug: string
  name: string
  imageFilename?: string
  questionCount?: number
  approvedQuestionCount?: number
  requiredScore?: number
  rating?: WebRating
  tags?: WebTag[]
  questions?: WebQuestion[]
  creator?: WebUser
  ownerId?: string
}
export type WebQuestion = {
  id: string
  slug: string
  examId?: string
  title: string
  imageFilename?: string
  difficulty?: string
  type?: string
  rating?: WebRating
  userMark?: number
  exam?: {
    id: string
    slug: string
    userSlug: string
    name: string
    imageFilename?: string
    questionCount?: number
    approvedQuestionCount?: number
    requiredScore?: number
    rating?: WebRating
  }
  creator?: WebUser
}
export type WebTag = { id: string; name: string; slug: string }
export type WebUser = {
  createdExamCount?: number
  createdQuestionCount?: number
  examSessionCount?: number
  id: string
  slug: string
  name?: string
  email?: string
  imageFilename?: string
  permissions?: string[]
  createdAt?: string
  updatedAt?: string
  rating?: WebRating
}
export type WebExamSession = {
  id: string
  examId: string
  exam?: { id: string; slug: string; userSlug: string; name: string }
  questionCount: number
  answeredQuestionCount: number
  correctAnswerCount?: number
  completedAt?: string
  createdAt?: string
}
export type WebListFilters = {
  userId?: string
  search?: string
  approved?: string
  exam?: string
  difficulty?: string
  type?: string
  tag?: string
  page?: number
  size?: number
  sort?: string
  order?: string
}
export type WebPage<T> = { data: T[]; page: number; size: number; hasNext: boolean }

declare global {
  var __exammeWebPool: Pool | undefined
}
const pool = globalThis.__exammeWebPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 2 })
if (process.env.NODE_ENV !== 'production') globalThis.__exammeWebPool = pool

async function query<T extends QueryResultRow>(text: string, values: unknown[] = []): Promise<T[]> {
  return (await pool.query<T>(text, values)).rows
}

const deletedFilter = '"deletedAt" IS NULL'

const pageOptions = (f: WebListFilters = {}) => ({
  page: Math.max(1, Number(f.page) || 1),
  size: Math.min(50, Math.max(1, Number(f.size) || 20))
})
const direction = (f: WebListFilters = {}) => (f.order === 'asc' ? 'ASC' : 'DESC')
const sortColumn = (f: WebListFilters, allowed: Record<string, string>, fallback: string) =>
  allowed[f.sort || ''] || fallback
const examTagsSelect = `(SELECT COALESCE(json_agg(json_build_object('id', t."id", 'name', t."name", 'slug', t."slug") ORDER BY t."name"), '[]'::json) FROM "examTags" t INNER JOIN "examExamTags" et ON et."examTagId" = t."id" WHERE et."examId" = "exams"."id") AS "tags"`
const userCountsSelect = `(SELECT COUNT(*)::int FROM "exams" e WHERE e."creatorId" = u."id" AND e."deletedAt" IS NULL) AS "createdExamCount", (SELECT COUNT(*)::int FROM "questions" q WHERE q."creatorId" = u."id" AND q."deletedAt" IS NULL) AS "createdQuestionCount", (SELECT COUNT(*)::int FROM "examSessions" s WHERE s."creatorId" = u."id" AND s."deletedAt" IS NULL) AS "examSessionCount"`
const userRatingSelect = 'u."rating" AS "rating"'

export async function getHomeData(size = 8, includeUnapproved = false, includeUnapprovedQuestions = includeUnapproved) {
  const [tags, exams, popularExams, questions, popularQuestions, popularUsers] = await Promise.all([
    query<WebTag>('SELECT "id", "name", "slug" FROM "examTags" ORDER BY "rating" DESC, "name" ASC LIMIT $1', [size]),
    query<WebExam>(
      `SELECT "id", COALESCE("slug", "id") AS "slug", COALESCE((SELECT u."slug" FROM "users" u WHERE u."id" = "exams"."creatorId"), "creatorId") AS "userSlug", "name", "imageFilename", "questionCount", "approvedQuestionCount", "requiredScore", "rating", ${examTagsSelect} FROM "exams" WHERE ${deletedFilter} ${includeUnapproved ? '' : 'AND "ownerId" IS NULL'} ORDER BY "id" DESC LIMIT $1`,
      [Math.min(size, 4)]
    ),
    query<WebExam>(
      `SELECT "id", COALESCE("slug", "id") AS "slug", COALESCE((SELECT u."slug" FROM "users" u WHERE u."id" = "exams"."creatorId"), "creatorId") AS "userSlug", "name", "imageFilename", "questionCount", "approvedQuestionCount", "requiredScore", "rating", ${examTagsSelect} FROM "exams" WHERE ${deletedFilter} ${includeUnapproved ? '' : 'AND "ownerId" IS NULL'} ORDER BY "rating" DESC NULLS LAST, "id" DESC LIMIT $1`,
      [Math.min(size, 4)]
    ),
    query<WebQuestion & { examName?: string; examSlug?: string; userSlug?: string }>(
      `SELECT q."id", COALESCE(q."slug", q."id") AS "slug", q."examId", q."title", q."imageFilename", q."difficulty", COALESCE(e."slug", e."id") AS "examSlug", COALESCE((SELECT u."slug" FROM "users" u WHERE u."id" = e."creatorId"), e."creatorId") AS "userSlug", e."name" AS "examName", q."rating" FROM "questions" q LEFT JOIN "exams" e ON e."id" = q."examId" WHERE q."deletedAt" IS NULL ${includeUnapprovedQuestions ? '' : 'AND q."ownerId" IS NULL'} ORDER BY q."id" DESC LIMIT $1`,
      [size]
    ),
    query<WebQuestion & { examName?: string; examSlug?: string; userSlug?: string }>(
      `SELECT q."id", COALESCE(q."slug", q."id") AS "slug", q."examId", q."title", q."imageFilename", q."difficulty", COALESCE(e."slug", e."id") AS "examSlug", COALESCE((SELECT u."slug" FROM "users" u WHERE u."id" = e."creatorId"), e."creatorId") AS "userSlug", e."name" AS "examName", q."rating" FROM "questions" q LEFT JOIN "exams" e ON e."id" = q."examId" WHERE q."deletedAt" IS NULL ${includeUnapprovedQuestions ? '' : 'AND q."ownerId" IS NULL'} ORDER BY q."rating" DESC NULLS LAST, q."id" DESC LIMIT $1`,
      [size]
    ),
    query<WebUser>(
      `SELECT u."id", COALESCE(u."slug", u."id") AS "slug", u."name", u."imageFilename", TO_CHAR(u."createdAt" AT TIME ZONE 'UTC', 'Dy Mon DD YYYY') AS "createdAt", u."updatedAt", ${userRatingSelect}, ${userCountsSelect} FROM "users" u WHERE u."deletedAt" IS NULL ORDER BY u."rating" DESC NULLS LAST, u."id" DESC LIMIT $1`,
      [size]
    )
  ])
  const mapQuestion = ({
    examName,
    examSlug,
    userSlug,
    ...q
  }: WebQuestion & { examName?: string; examSlug?: string; userSlug?: string }) => ({
    ...q,
    exam: examName ? { id: q.examId!, slug: examSlug!, userSlug: userSlug!, name: examName } : undefined
  })
  return {
    tags,
    exams,
    popularExams,
    questions: questions.map(mapQuestion),
    popularQuestions: popularQuestions.map(mapQuestion),
    popularUsers
  }
}

export async function getExams(size = 50) {
  return query<WebExam>(
    `SELECT "id", COALESCE("slug", "id") AS "slug", COALESCE((SELECT u."slug" FROM "users" u WHERE u."id" = "exams"."creatorId"), "creatorId") AS "userSlug", "name", "imageFilename", "questionCount", "approvedQuestionCount", "requiredScore", "rating", ${examTagsSelect} FROM "exams" WHERE ${deletedFilter} ORDER BY "id" DESC LIMIT $1`,
    [size]
  )
}

export async function getExamList(f: WebListFilters = {}, includeUnapproved = false): Promise<WebPage<WebExam>> {
  const { page, size } = pageOptions(f),
    conditions = [deletedFilter, ...(includeUnapproved ? [] : ['"ownerId" IS NULL'])],
    values: unknown[] = []
  if (f.search) {
    values.push(`%${f.search}%`)
    conditions.push(`"name" ILIKE ${values.length}`)
  }
  if (f.approved === 'yes') conditions.push('"ownerId" IS NULL')
  if (f.approved === 'no') conditions.push('"ownerId" IS NOT NULL')
  if (f.userId) {
    values.push(f.userId)
    conditions.push(`"creatorId" = $${values.length}`)
  }
  if (f.tag) {
    values.push(f.tag)
    conditions.push(
      `"id" IN (SELECT "examId" FROM "examExamTags" et INNER JOIN "examTags" t ON t."id" = et."examTagId" WHERE t."slug" = $${values.length})`
    )
  }
  const column = sortColumn(f, { name: '"name"', createdAt: '"createdAt"' }, '"id"')
  values.push(size + 1, (page - 1) * size)
  const rows = await query<WebExam>(
    `SELECT "id", COALESCE("slug", "id") AS "slug", COALESCE((SELECT u."slug" FROM "users" u WHERE u."id" = "exams"."creatorId"), "creatorId") AS "userSlug", "name", "imageFilename", "questionCount", "approvedQuestionCount", "requiredScore", "rating", ${examTagsSelect} FROM "exams" WHERE ${conditions.join(' AND ')} ORDER BY ${column} ${direction(f)} LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  )
  return { data: rows.slice(0, size), page, size, hasNext: rows.length > size }
}

export async function getQuestions(size = 50, includeUnapproved = false) {
  const rows = await query<WebQuestion & { examName?: string; examSlug?: string; userSlug?: string }>(
    `SELECT q."id", COALESCE(q."slug", q."id") AS "slug", q."examId", q."title", q."imageFilename", q."difficulty", q."type", COALESCE(e."slug", e."id") AS "examSlug", COALESCE((SELECT u."slug" FROM "users" u WHERE u."id" = e."creatorId"), e."creatorId") AS "userSlug", e."name" AS "examName", q."rating" FROM "questions" q LEFT JOIN "exams" e ON e."id" = q."examId" WHERE q."deletedAt" IS NULL ${includeUnapproved ? '' : 'AND q."ownerId" IS NULL'} ORDER BY q."id" DESC LIMIT $1`,
    [size]
  )
  return rows.map(({ examName, examSlug, userSlug, ...q }) => ({
    ...q,
    exam: examName ? { id: q.examId!, slug: examSlug!, userSlug: userSlug!, name: examName } : undefined
  }))
}

export async function getQuestionList(
  f: WebListFilters = {},
  includeUnapproved = false
): Promise<WebPage<WebQuestion>> {
  const { page, size } = pageOptions(f),
    conditions = [`q.${deletedFilter}`, ...(includeUnapproved ? [] : ['q."ownerId" IS NULL'])],
    values: unknown[] = []
  if (f.search) {
    values.push(`%${f.search}%`)
    conditions.push(`q."title" ILIKE $${values.length}`)
  }
  if (f.exam) {
    values.push(f.exam)
    conditions.push(`q."examId" = $${values.length}`)
  }
  if (f.difficulty) {
    values.push(f.difficulty)
    conditions.push(`q."difficulty" = $${values.length}`)
  }
  if (f.type) {
    values.push(f.type)
    conditions.push(`q."type" = $${values.length}`)
  }
  if (f.approved === 'yes') conditions.push('q."ownerId" IS NULL')
  if (f.approved === 'no') conditions.push('q."ownerId" IS NOT NULL')
  const column = sortColumn(f, { title: 'q."title"', createdAt: 'q."createdAt"' }, 'q."id"')
  values.push(size + 1, (page - 1) * size)
  const rows = await query<WebQuestion & { examName?: string; examSlug?: string; userSlug?: string }>(
    `SELECT q."id", COALESCE(q."slug", q."id") AS "slug", q."examId", q."title", q."imageFilename", q."difficulty", q."type", COALESCE(e."slug", e."id") AS "examSlug", COALESCE((SELECT u."slug" FROM "users" u WHERE u."id" = e."creatorId"), e."creatorId") AS "userSlug", e."name" AS "examName", q."rating" FROM "questions" q LEFT JOIN "exams" e ON e."id" = q."examId" WHERE ${conditions.join(' AND ')} ORDER BY ${column} ${direction(f)} LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  )
  return {
    data: rows.slice(0, size).map(({ examName, examSlug, userSlug, ...q }) => ({
      ...q,
      exam: examName ? { id: q.examId!, slug: examSlug!, userSlug: userSlug!, name: examName } : undefined
    })),
    page,
    size,
    hasNext: rows.length > size
  }
}

export async function getExamOptions(size = 100) {
  return query<{ id: string; name: string }>(
    `SELECT "id", "name" FROM "exams" WHERE ${deletedFilter} ORDER BY "name" ASC LIMIT $1`,
    [size]
  )
}

export async function getExam(examSlug: string, includeUnapproved = false) {
  const exams = await query<WebExam>(
    `SELECT "id", COALESCE("slug", "id") AS "slug", COALESCE((SELECT u."slug" FROM "users" u WHERE u."id" = "exams"."creatorId"), "creatorId") AS "userSlug", "name", "imageFilename", "questionCount", "approvedQuestionCount", "requiredScore", "rating", "ownerId", ${examTagsSelect} FROM "exams" WHERE ("slug" = $1 OR "id" = $1) AND ${deletedFilter} ${includeUnapproved ? '' : 'AND "ownerId" IS NULL'}`,
    [examSlug]
  )
  if (!exams[0]) return undefined
  const [tags, questions] = await Promise.all([
    query<WebTag>(
      'SELECT t."id", t."name", t."slug" FROM "examTags" t INNER JOIN "examExamTags" et ON et."examTagId" = t."id" WHERE et."examId" = $1 ORDER BY t."name" ASC',
      [exams[0].id]
    ),
    query<WebQuestion>(
      `SELECT "id", COALESCE("slug", "id") AS "slug", "examId", "title", "imageFilename", "difficulty", "type", "rating", COALESCE((SELECT u."slug" FROM "users" u INNER JOIN "exams" e ON e."creatorId" = u."id" WHERE e."id" = "questions"."examId"), (SELECT e."creatorId" FROM "exams" e WHERE e."id" = "questions"."examId")) AS "userSlug" FROM "questions" WHERE "examId" = $1 AND "deletedAt" IS NULL ${includeUnapproved ? '' : 'AND "ownerId" IS NULL'} ORDER BY "id" ASC`,
      [exams[0].id]
    )
  ])
  return { ...exams[0], tags, questions, creator: await getUser(exams[0].userSlug) }
}

export async function getQuestion(questionSlug: string, userId?: string, includeUnapproved = false) {
  const values: unknown[] = [questionSlug]
  const userMark = userId ? ', m."mark" AS "userMark"' : ''
  const userJoin = userId ? ' LEFT JOIN "questionRatingMarks" m ON m."questionId" = q."id" AND m."creatorId" = $2' : ''
  if (userId) values.push(userId)
  const rows = await query<
    WebQuestion & {
      examName?: string
      examSlug?: string
      userSlug?: string
      examImageFilename?: string
      examQuestionCount?: number
      examApprovedQuestionCount?: number
      examRequiredScore?: number
      examRating?: WebRating
    }
  >(
    `SELECT q."id", COALESCE(q."slug", q."id") AS "slug", q."examId", q."title", q."imageFilename", q."difficulty", q."type", COALESCE(e."slug", e."id") AS "examSlug", COALESCE((SELECT u."slug" FROM "users" u WHERE u."id" = e."creatorId"), e."creatorId") AS "userSlug", e."name" AS "examName", e."imageFilename" AS "examImageFilename", e."questionCount" AS "examQuestionCount", e."approvedQuestionCount" AS "examApprovedQuestionCount", e."requiredScore" AS "examRequiredScore", e."rating" AS "examRating", q."rating"${userMark} FROM "questions" q LEFT JOIN "exams" e ON e."id" = q."examId"${userJoin} WHERE (q."slug" = $1 OR q."id" = $1) AND q."deletedAt" IS NULL ${includeUnapproved ? '' : 'AND q."ownerId" IS NULL'}`,
    values
  )
  if (!rows[0]) return undefined
  const {
    examName,
    examSlug,
    userSlug,
    examImageFilename,
    examQuestionCount,
    examApprovedQuestionCount,
    examRequiredScore,
    examRating,
    ...q
  } = rows[0]
  return {
    ...q,
    creator: userSlug ? await getUser(userSlug) : undefined,
    exam: examName
      ? {
          id: q.examId!,
          slug: examSlug!,
          userSlug: userSlug!,
          name: examName,
          imageFilename: examImageFilename,
          questionCount: examQuestionCount,
          approvedQuestionCount: examApprovedQuestionCount,
          requiredScore: examRequiredScore,
          rating: examRating
        }
      : undefined
  }
}
export async function getUsers(size = 50) {
  return query<WebUser>(
    `SELECT u."id", COALESCE(u."slug", u."id") AS "slug", u."name", u."imageFilename", TO_CHAR(u."createdAt" AT TIME ZONE 'UTC', 'Dy Mon DD YYYY') AS "createdAt", u."updatedAt", ${userRatingSelect}, ${userCountsSelect} FROM "users" u WHERE u."deletedAt" IS NULL ORDER BY u."id" DESC LIMIT $1`,
    [size]
  )
}

export async function getUserList(f: WebListFilters = {}): Promise<WebPage<WebUser>> {
  const { page, size } = pageOptions(f),
    conditions = ['u."deletedAt" IS NULL'],
    values: unknown[] = []
  if (f.search) {
    values.push(`%${f.search}%`)
    conditions.push(`u."name" ILIKE $${values.length}`)
  }
  const column = sortColumn(f, { name: 'u."name"', createdAt: 'u."createdAt"' }, 'u."id"')
  values.push(size + 1, (page - 1) * size)
  const rows = await query<WebUser>(
    `SELECT u."id", COALESCE(u."slug", u."id") AS "slug", u."name", u."imageFilename", TO_CHAR(u."createdAt" AT TIME ZONE 'UTC', 'Dy Mon DD YYYY') AS "createdAt", u."updatedAt", ${userRatingSelect}, ${userCountsSelect} FROM "users" u WHERE ${conditions.join(' AND ')} ORDER BY ${column} ${direction(f)} LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  )
  return { data: rows.slice(0, size), page, size, hasNext: rows.length > size }
}

export async function getUserExams(userId: string) {
  return getExamList({ userId, size: 50 })
}

export async function getUserExamSessions(userId: string): Promise<WebExamSession[]> {
  const rows = await query<
    WebExamSession & {
      questions?: Array<{ choice?: number; answer?: string }>
      examName?: string
      examSlug?: string
      userSlug?: string
    }
  >(
    `SELECT s."id", s."examId", s."questions", s."correctAnswerCount", s."completedAt", s."createdAt", COALESCE(e."slug", e."id") AS "examSlug", COALESCE((SELECT u."slug" FROM "users" u WHERE u."id" = e."creatorId"), e."creatorId") AS "userSlug", e."name" AS "examName" FROM "examSessions" s LEFT JOIN "exams" e ON e."id" = s."examId" WHERE s."ownerId" = $1 AND s."deletedAt" IS NULL ORDER BY s."id" DESC LIMIT 50`,
    [userId]
  )
  return rows.map(({ questions = [], examName, examSlug, userSlug, ...session }) => ({
    ...session,
    questionCount: questions.length,
    answeredQuestionCount: questions.filter(
      (question) => typeof question.choice === 'number' || typeof question.answer === 'string'
    ).length,
    exam: examName ? { id: session.examId, slug: examSlug!, userSlug: userSlug!, name: examName } : undefined
  }))
}

export async function getUserCredentials(email: string): Promise<{ id: string; password: string } | undefined> {
  return (
    await query<{ id: string; password: string }>(
      'SELECT "id", "password" FROM "users" WHERE "email" = $1 AND "deletedAt" IS NULL',
      [email]
    )
  )[0]
}

export async function getUser(userSlug: string) {
  return (
    await query<WebUser>(
      `SELECT u."id", COALESCE(u."slug", u."id") AS "slug", u."name", u."imageFilename", u."email", u."permissions", TO_CHAR(u."createdAt" AT TIME ZONE 'UTC', 'Dy Mon DD YYYY') AS "createdAt", u."updatedAt", ${userRatingSelect}, ${userCountsSelect} FROM "users" u WHERE (u."slug" = $1 OR u."id" = $1) AND u."deletedAt" IS NULL`,
      [userSlug]
    )
  )[0]
}
export async function getTag(tagSlug: string) {
  return (await query<WebTag>('SELECT "id", "name", "slug" FROM "examTags" WHERE "slug" = $1', [tagSlug]))[0]
}
