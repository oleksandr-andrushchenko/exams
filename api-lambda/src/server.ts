import path from 'node:path'
import { randomUUID } from 'node:crypto'
import multer from 'multer'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
import express from 'express'
import { Container } from 'typedi'
import { controllerRoute } from '../../shared/src/http'
import config from '../../shared/src/config'
import { createApp, createLambdaHandler, startApp } from '../../shared/src/app'
import { MeController } from './controllers/MeController'
import { UserController } from './controllers/UserController'
import { ExamController } from './controllers/ExamController'
import { QuestionController } from './controllers/QuestionController'
import { ActivityController } from './controllers/ActivityController'
import { ExamSessionController } from './controllers/ExamSessionController'
import { ExamTagController } from './controllers/ExamTagController'
import { PermissionController } from './controllers/PermissionController'
import { AuthenticateController } from './controllers/AuthenticateController'

const context = createApp(__dirname, ({ app, logger }) => {
  const meController = Container.get(MeController)
  const userController = Container.get(UserController)
  const examController = Container.get(ExamController)
  const questionController = Container.get(QuestionController)
  const activityController = Container.get(ActivityController)
  const examSessionController = Container.get(ExamSessionController)
  const examTagController = Container.get(ExamTagController)
  const permissionController = Container.get(PermissionController)
  const authenticateController = Container.get(AuthenticateController)

  const imageExtensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp'
  }
  const uploadImage = multer({
    storage: multer.diskStorage({
      destination: path.resolve(process.cwd(), 'static'),
      filename: (_request, file, callback) =>
        callback(null, randomUUID() + imageExtensions[file.mimetype])
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_request, file, callback) =>
      callback(null, Object.prototype.hasOwnProperty.call(imageExtensions, file.mimetype))
  }).single('image')

  app.use(morgan(config.logger.format, { stream: { write: logger.info.bind(logger) } }))
  app.use(cors({ origin: config.client_url, credentials: true }))
  app.use(express.json({ limit: '10mb' }))

  app.post('/login', controllerRoute(authenticateController, 'login'))
  app.post('/logout', controllerRoute(authenticateController, 'logout'))
  app.post('/auth/token', controllerRoute(authenticateController, 'token'))

  app.get('/me', controllerRoute(meController, 'getMe'))
  app.post('/me', controllerRoute(meController, 'createMe'))
  app.patch('/me', controllerRoute(meController, 'updateMe'))
  app.delete('/me', controllerRoute(meController, 'deleteMe'))

  app.get('/users', controllerRoute(userController, 'getUsers'))
  app.get('/users/:userId', controllerRoute(userController, 'getUser'))
  app.post('/users', controllerRoute(userController, 'createUser'))
  app.patch('/users/:userId', controllerRoute(userController, 'updateUser'))
  app.delete('/users/:userId', controllerRoute(userController, 'deleteUser'))

  app.get('/exams', controllerRoute(examController, 'getExamsRoute'))
  app.post('/exams', controllerRoute(examController, 'createExam'))
  app.get('/exams/:examId', controllerRoute(examController, 'getExamRoute'))
  app.patch('/exams/:examId', controllerRoute(examController, 'updateExamRoute'))
  app.delete('/exams/:examId', controllerRoute(examController, 'deleteExamRoute'))
  app.post('/exams/:examId/rating', controllerRoute(examController, 'rateExamRoute'))
  app.post('/exams/:examId/approve', controllerRoute(examController, 'approveExamRoute'))

  app.get('/questions', controllerRoute(questionController, 'getQuestionsRoute'))
  app.post('/questions', controllerRoute(questionController, 'createQuestionRoute'))
  app.get('/questions/:questionId', controllerRoute(questionController, 'getQuestionRoute'))
  app.patch('/questions/:questionId', controllerRoute(questionController, 'updateQuestionRoute'))
  app.delete('/questions/:questionId', controllerRoute(questionController, 'deleteQuestionRoute'))
  app.post('/questions/:questionId/rating', controllerRoute(questionController, 'rateQuestionRoute'))
  app.post('/questions/:questionId/approve', controllerRoute(questionController, 'approveQuestionRoute'))

  app.post('/exam-sessions', controllerRoute(examSessionController, 'createRoute'))
  app.get('/exam-sessions', controllerRoute(examSessionController, 'listRoute'))
  app.get('/exam-sessions/current', controllerRoute(examSessionController, 'currentRoute'))
  app.get('/exam-sessions/:examSessionId', controllerRoute(examSessionController, 'getRoute'))
  app.post('/exam-sessions/:examSessionId/completion', controllerRoute(examSessionController, 'completionRoute'))
  app.delete('/exam-sessions/:examSessionId', controllerRoute(examSessionController, 'deleteRoute'))
  app.get('/exam-sessions/:examSessionId/questions/:question', controllerRoute(examSessionController, 'questionRoute'))
  app.post('/exam-sessions/:examSessionId/questions/:question/answer', controllerRoute(examSessionController, 'answerRoute'))
  app.delete('/exam-sessions/:examSessionId/questions/:question/answer', controllerRoute(examSessionController, 'answerDeleteRoute'))

  app.get('/exam-tags', controllerRoute(examTagController, 'route'))
  app.get('/activities', controllerRoute(activityController, 'route'))
  app.get('/permissions', controllerRoute(permissionController, 'route'))

  app.post('/upload', uploadImage, controllerRoute(userController, 'upload'))

  app.use(compression())
})

export const handler = createLambdaHandler(context)

if (require.main === module) startApp(context, 'api').catch((error) => {
  context.logger.error(error)
  process.exit(1)
})
