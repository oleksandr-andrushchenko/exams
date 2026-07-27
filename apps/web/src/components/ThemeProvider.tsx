import { ThemeProvider as BootstrapThemeProvider } from '@/components/bootstrap'

export default function ThemeProvider({children}: { children: any }) {
  return (
          <BootstrapThemeProvider>
            {children}
          </BootstrapThemeProvider>
  )
}