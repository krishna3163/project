import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React Tree:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#080c14',
          fontFamily: 'Inter, sans-serif',
          color: '#f1f5f9',
          padding: '24px'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            backdropFilter: 'blur(12px)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: '#ef4444',
              fontSize: '32px'
            }}>
              ⚠️
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#f1f5f9' }}>
              Oops! Something went wrong
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              A client-side runtime error has occurred. Please find the details below.
            </p>
            <div style={{
              background: '#090d16',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '24px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              overflowX: 'auto',
              maxHeight: '200px'
            }}>
              <div style={{ color: '#f87171', fontWeight: 600, fontSize: '13px', marginBottom: '8px', fontFamily: 'monospace' }}>
                {this.state.error?.toString()}
              </div>
              {this.state.errorInfo && (
                <pre style={{ color: '#64748b', fontSize: '11px', margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                border: 0,
                borderRadius: '8px',
                color: '#fff',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
