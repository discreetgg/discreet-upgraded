'use client'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorState from './error-state'

export default function ErrorBoundaryWrapper({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => {
        if (error instanceof Error) console.error(error.message)
        return (
          <ErrorState
            title={title}
            description={'Something went wrong.'}
            resetErrorBoundary={resetErrorBoundary}
          />
        )
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
