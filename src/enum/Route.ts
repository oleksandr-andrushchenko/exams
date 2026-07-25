enum Route {
  Home = '/',
  Exams = '/exams',
  Exam = '/exams/:examId',
  ExamTag = '/tags/:tagSlug',
  Questions = '/questions',
  Question = '/exams/:examId/questions/:questionId',
  ExamSession = '/examSessions/:examSessionId',
  Login = '/login',
  Register = '/register',
  Terms = '/terms-and-conditions',
  Users = '/users',
  User = '/users/:userId',
}

export default Route