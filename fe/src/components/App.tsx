import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import Home from '../pages/Home'
import Exams from '../pages/Exams'
import ThemeProvider from './ThemeProvider'
import Exam from '../pages/Exam'
import NotFound from '../pages/NotFound'
import Terms from '../pages/Terms'
import { AuthenticationProvider } from '../hooks/useAuth'
import { default as Path } from '../enum/Route'
import Question from '../pages/Question'
import Questions from '../pages/Questions'
import ExamSession from '../pages/ExamSession'
import RequireAuthentication from './RequireAuthentication'
import { ApolloProvider } from '@apollo/client'
import apolloClient from '../api/apolloClient'
import Users from '../pages/Users'
import User from '../pages/User'
import ExamTag from '../pages/ExamTag'
import Login from './Login'
import Register from './Register'
import Link from './elements/Link'
import { Breadcrumbs } from '@material-tailwind/react'
import { HomeIcon } from '@heroicons/react/24/solid'

const routes = <Routes>
  <Route element={ <Layout/> }>
    <Route path={ Path.Home } element={ <Home/> }/>
    <Route path={ Path.Exams } element={ <Exams/> }/>
    <Route path={ Path.Exam } element={ <Exam/> }/>
    <Route path={ Path.ExamTag } element={ <ExamTag/> }/>
    <Route path={ Path.Questions } element={ <Questions/> }/>
    <Route path={ Path.Question } element={ <Question/> }/>
    <Route element={ <RequireAuthentication/> }>
      <Route path={ Path.ExamSession } element={ <ExamSession/> }/>
    </Route>
    <Route path={ Path.Login } element={ <><Breadcrumbs><Link icon={ HomeIcon } label="Home" to={ Path.Home }/></Breadcrumbs><Login/></> }/>
    <Route path={ Path.Register } element={ <><Breadcrumbs><Link icon={ HomeIcon } label="Home" to={ Path.Home }/></Breadcrumbs><Register/></> }/>
    <Route path={ Path.Terms } element={ <Terms/> }/>
    <Route path={ Path.Users } element={ <Users/> }/>
    <Route path={ Path.User } element={ <User/> }/>
    <Route path="*" element={ <NotFound/> }/>
  </Route>
</Routes>

export default function App() {
  return (
    <AuthenticationProvider>
      <ThemeProvider>
        <ApolloProvider client={ apolloClient }>
          <BrowserRouter>
            { routes }
          </BrowserRouter>
        </ApolloProvider>
      </ThemeProvider>
    </AuthenticationProvider>
  )
}
