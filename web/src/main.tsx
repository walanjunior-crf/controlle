import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'
import { db } from './db/db'

declare global {
  interface Window {
    __bootErrors?: string[]
    __showBootError?: (title?: string) => void
  }
}

const describe = (err: unknown): string =>
  err instanceof Error ? `${err.name}: ${err.message}` : String(err)

/** Se algo quebrar ao desenhar a tela, mostra o motivo em vez de uma tela branca. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown }
  static getDerivedStateFromError(error: unknown) {
    return { error }
  }
  componentDidCatch(error: unknown, info: ErrorInfo) {
    window.__bootErrors?.push(describe(error), (info.componentStack ?? '').trim().split('\n').slice(0, 4).join('\n'))
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="crash">
        <h1>Algo deu errado</h1>
        <p>O Controlle encontrou um erro. Seus dados continuam salvos no aparelho.</p>
        <pre>{(window.__bootErrors ?? [describe(this.state.error)]).join('\n')}</pre>
        <button type="button" className="btn btn-primary" onClick={() => location.reload()}>
          Tentar de novo
        </button>
      </div>
    )
  }
}

// Abre o banco antes de desenhar o app: enquanto isso, o "Carregando…" do index.html
// fica na tela; se o banco falhar, o motivo aparece em vez de uma tela em branco.
db.open()
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    )
  })
  .catch((err: unknown) => {
    window.__bootErrors?.push(`Banco de dados: ${describe(err)}`)
    window.__showBootError?.('Não foi possível abrir os dados do Controlle neste navegador.')
  })
