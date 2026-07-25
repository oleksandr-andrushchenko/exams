import { Pool, QueryResultRow } from 'pg'

export type SsrExam = { id: string; name: string; questionCount?: number; approvedQuestionCount?: number; requiredScore?: number }
export type SsrQuestion = { id: string; examId?: string; title: string; difficulty?: string; type?: string; exam?: { id: string; name: string } }
export type SsrTag = { id: string; name: string; slug: string }
export type SsrUser = { id: string; name?: string; createdAt?: string; updatedAt?: string }
export type SsrExamSession = { id: string; examId: string; exam?: { id: string; name: string }; questionCount: number; answeredQuestionCount: number; correctAnswerCount?: number; completedAt?: string; createdAt?: string }
export type SsrListFilters = { userId?: string; search?: string; approved?: string; exam?: string; difficulty?: string; type?: string; tag?: string; page?: number; size?: number; sort?: string; order?: string }
export type SsrPage<T> = { data: T[]; page: number; size: number; hasNext: boolean }

declare global { var __exammeSsrPool: Pool | undefined }
const pool = globalThis.__exammeSsrPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 2 })
if (process.env.NODE_ENV !== 'production') globalThis.__exammeSsrPool = pool

async function query<T extends QueryResultRow>(text: string, values: unknown[] = []): Promise<T[]> {
  return (await pool.query<T>(text, values)).rows
}

const deletedFilter = '"deletedAt" IS NULL'
const pageOptions = (f: SsrListFilters = {}) => ({ page: Math.max(1, Number(f.page) || 1), size: Math.min(50, Math.max(1, Number(f.size) || 20)) })
const direction = (f: SsrListFilters = {}) => f.order === 'asc' ? 'ASC' : 'DESC'
const sortColumn = (f: SsrListFilters, allowed: Record<string, string>, fallback: string) => allowed[f.sort || ''] || fallback

export async function getHomeData(size = 8) {
  const [tags, exams, questions] = await Promise.all([
    query<SsrTag>('SELECT "id", "name", "slug" FROM "examTags" ORDER BY "rating" DESC, "name" ASC LIMIT $1', [size]),
    query<SsrExam>(`SELECT "id", "name", "questionCount", "approvedQuestionCount", "requiredScore" FROM "exams" WHERE ${deletedFilter} AND "ownerId" IS NULL ORDER BY "id" DESC LIMIT $1`, [size]),
    query<SsrQuestion & { examName?: string }>(`SELECT q."id", q."examId", q."title", q."difficulty", e."name" AS "examName" FROM "questions" q LEFT JOIN "exams" e ON e."id" = q."examId" WHERE q."deletedAt" IS NULL AND q."ownerId" IS NULL ORDER BY q."id" DESC LIMIT $1`, [size]),
  ])
  return { tags, exams, questions: questions.map(({ examName, ...q }) => ({ ...q, exam: examName ? { id: q.examId!, name: examName } : undefined })) }
}

export async function getExams(size = 50) { return query<SsrExam>(`SELECT "id", "name", "questionCount", "approvedQuestionCount", "requiredScore" FROM "exams" WHERE ${deletedFilter} ORDER BY "id" DESC LIMIT $1`, [size]) }

export async function getExamList(f: SsrListFilters = {}): Promise<SsrPage<SsrExam>> {
  const { page, size } = pageOptions(f), conditions = [deletedFilter], values: unknown[] = []
  if (f.search) { values.push(`%${f.search}%`); conditions.push(`"name" ILIKE $${values.length}`) }
  if (f.approved === 'yes') conditions.push('"ownerId" IS NULL')
  if (f.approved === 'no') conditions.push('"ownerId" IS NOT NULL')
  if (f.userId) { values.push(f.userId); conditions.push(`"creatorId" = $${values.length}`) }
  if (f.tag) { values.push(f.tag); conditions.push(`"id" IN (SELECT "examId" FROM "examExamTags" et INNER JOIN "examTags" t ON t."id" = et."examTagId" WHERE t."slug" = $${values.length})`) }
  const column = sortColumn(f, { name: '"name"', createdAt: '"createdAt"' }, '"id"')
  values.push(size + 1, (page - 1) * size)
  const rows = await query<SsrExam>(`SELECT "id", "name", "questionCount", "approvedQuestionCount", "requiredScore" FROM "exams" WHERE ${conditions.join(' AND ')} ORDER BY ${column} ${direction(f)} LIMIT $${values.length - 1} OFFSET $${values.length}`, values)
  return { data: rows.slice(0, size), page, size, hasNext: rows.length > size }
}

export async function getQuestions(size = 50) {
  const rows = await query<SsrQuestion & { examName?: string }>(`SELECT q."id", q."examId", q."title", q."difficulty", q."type", e."name" AS "examName" FROM "questions" q LEFT JOIN "exams" e ON e."id" = q."examId" WHERE q."deletedAt" IS NULL AND q."ownerId" IS NULL ORDER BY q."id" DESC LIMIT $1`, [size])
  return rows.map(({ examName, ...q }) => ({ ...q, exam: examName ? { id: q.examId!, name: examName } : undefined }))
}

export async function getQuestionList(f: SsrListFilters = {}): Promise<SsrPage<SsrQuestion>> {
  const { page, size } = pageOptions(f), conditions = [`q.${deletedFilter}`], values: unknown[] = []
  if (f.search) { values.push(`%${f.search}%`); conditions.push(`q."title" ILIKE $${values.length}`) }
  if (f.exam) { values.push(f.exam); conditions.push(`q."examId" = $${values.length}`) }
  if (f.difficulty) { values.push(f.difficulty); conditions.push(`q."difficulty" = $${values.length}`) }
  if (f.type) { values.push(f.type); conditions.push(`q."type" = $${values.length}`) }
  if (f.approved === 'yes') conditions.push('q."ownerId" IS NULL')
  if (f.approved === 'no') conditions.push('q."ownerId" IS NOT NULL')
  const column = sortColumn(f, { title: 'q."title"', createdAt: 'q."createdAt"' }, 'q."id"')
  values.push(size + 1, (page - 1) * size)
  const rows = await query<SsrQuestion & { examName?: string }>(`SELECT q."id", q."examId", q."title", q."difficulty", q."type", e."name" AS "examName" FROM "questions" q LEFT JOIN "exams" e ON e."id" = q."examId" WHERE ${conditions.join(' AND ')} ORDER BY ${column} ${direction(f)} LIMIT $${values.length - 1} OFFSET $${values.length}`, values)
  return { data: rows.slice(0, size).map(({ examName, ...q }) => ({ ...q, exam: examName ? { id: q.examId!, name: examName } : undefined })), page, size, hasNext: rows.length > size }
}

export async function getExamOptions(size = 100) { return query<{ id: string; name: string }>(`SELECT "id", "name" FROM "exams" WHERE ${deletedFilter} ORDER BY "name" ASC LIMIT $1`, [size]) }

export async function getExam(examId: string) {
  const exams = await query<SsrExam>(`SELECT "id", "name", "questionCount", "approvedQuestionCount", "requiredScore" FROM "exams" WHERE "id" = $1 AND ${deletedFilter}`, [examId])
  if (!exams[0]) return undefined
  const tags = await query<SsrTag>('SELECT t."id", t."name", t."slug" FROM "examTags" t INNER JOIN "examExamTags" et ON et."examTagId" = t."id" WHERE et."examId" = $1 ORDER BY t."name" ASC', [examId])
  return { ...exams[0], tags }
}

export async function getQuestion(questionId: string) {
  const rows = await query<SsrQuestion & { examName?: string }>(`SELECT q."id", q."examId", q."title", q."difficulty", q."type", e."name" AS "examName" FROM "questions" q LEFT JOIN "exams" e ON e."id" = q."examId" WHERE q."id" = $1 AND q."deletedAt" IS NULL AND q."ownerId" IS NULL`, [questionId])
  if (!rows[0]) return undefined
  const { examName, ...q } = rows[0]
  return { ...q, exam: examName ? { id: q.examId!, name: examName } : undefined }
}

export async function getUsers(size = 50) { return query<SsrUser>(`SELECT "id", "name", "createdAt", "updatedAt" FROM "users" WHERE ${deletedFilter} ORDER BY "id" DESC LIMIT $1`, [size]) }

export async function getUserList(f: SsrListFilters = {}): Promise<SsrPage<SsrUser>> {
  const { page, size } = pageOptions(f), conditions = [deletedFilter], values: unknown[] = []
  if (f.search) { values.push(`%${f.search}%`); conditions.push(`"name" ILIKE $${values.length}`) }
  const column = sortColumn(f, { name: '"name"', createdAt: '"createdAt"' }, '"id"')
  values.push(size + 1, (page - 1) * size)
  const rows = await query<SsrUser>(`SELECT "id", "name", "createdAt", "updatedAt" FROM "users" WHERE ${conditions.join(' AND ')} ORDER BY ${column} ${direction(f)} LIMIT $${values.length - 1} OFFSET $${values.length}`, values)
  return { data: rows.slice(0, size), page, size, hasNext: rows.length > size }
}

export async function getUserExams(userId: string) { return getExamList({ userId, size: 50 }) }

export async function getUserExamSessions(userId: string): Promise<SsrExamSession[]> {
  const rows = await query<SsrExamSession & { questions?: Array<{ choice?: number; answer?: string }>; examName?: string }>(`SELECT s."id", s."examId", s."questions", s."correctAnswerCount", s."completedAt", s."createdAt", e."name" AS "examName" FROM "examSessions" s LEFT JOIN "exams" e ON e."id" = s."examId" WHERE s."ownerId" = $1 AND s."deletedAt" IS NULL ORDER BY s."id" DESC LIMIT 50`, [userId])
  return rows.map(({ questions = [], examName, ...session }) => ({ ...session, questionCount: questions.length, answeredQuestionCount: questions.filter(question => typeof question.choice === 'number' || typeof question.answer === 'string').length, exam: examName ? { id: session.examId, name: examName } : undefined }))
}

export async function getUser(userId: string) { return (await query<SsrUser>('SELECT "id", "name", "createdAt", "updatedAt" FROM "users" WHERE "id" = $1 AND "deletedAt" IS NULL', [userId]))[0] }
export async function getTag(tagSlug: string) { return (await query<SsrTag>('SELECT "id", "name", "slug" FROM "examTags" WHERE "slug" = $1', [tagSlug]))[0] }
