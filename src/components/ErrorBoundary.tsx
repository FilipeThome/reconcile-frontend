import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Falha de renderização', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <section className="error-boundary" role="alert">
        <h1>Algo deu errado</h1>
        <p className="muted">{this.state.error.message || 'Falha inesperada na interface.'}</p>
        <button type="button" className="btn-primary btn" onClick={() => this.setState({ error: null })}>
          Tentar novamente
        </button>
      </section>
    )
  }
}
