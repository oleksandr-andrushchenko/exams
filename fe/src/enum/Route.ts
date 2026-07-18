enum Route {
  Home = '/',
  Exams = '/exams',
  Exam = '/exams/:examId',
  Questions = '/questions',
  Question = '/exams/:examId/questions/:questionId',
  ExamSession = '/examSessions/:examSessionId',
  Login = '/login',
  Register = '/register',
  Terms = '/terms-and-conditions',
  Users = '/users',
}

export default Route