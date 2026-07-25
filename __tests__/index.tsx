import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import AuthPage from '../apps/web/src/components/AuthPage'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }))

export const config = () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())
}

export function renderRoute(route = '/') {
  window.history.pushState({}, 'Test page', route)
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
  const rendered = render(<AuthPage mode={route === '/register' ? 'register' : 'login'} />)
  return { user, ...rendered }
}

export * from '@testing-library/react'
