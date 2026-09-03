import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  name?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetLocal = () => {
    try {
      // Clear potentially corrupt storage keys while keeping backups
      sessionStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // If it's a sub-component with a name (not root App), show a localized subtle warning instead of taking over the full page
      if (this.props.name) {
        return (
          <div className="p-2 border border-red-500/30 bg-red-950/30 rounded text-xs text-red-300 flex items-center justify-between">
            <span>Erro ao carregar componente ({this.props.name})</span>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-red-400 hover:text-red-200 underline text-xs ml-2"
            >
              Tentar novamente
            </button>
          </div>
        );
      }

      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#09090b',
          color: '#f4f4f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '640px',
            width: '100%',
            backgroundColor: '#18181b',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px' }}>⚠️</span>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#fca5a5' }}>
                Falha na Inicialização do Codex
              </h1>
            </div>
            
            <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
              O aplicativo encontrou um erro inesperado ao carregar os dados. Seus dados estão seguros na nuvem/armazenamento.
            </p>

            <div style={{
              backgroundColor: '#09090b',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#ef4444',
              overflowX: 'auto',
              marginBottom: '24px',
              maxHeight: '180px'
            }}>
              {this.state.error?.message || 'Erro desconhecido durante a renderização inicial.'}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Recarregar Página
              </button>
              <button
                onClick={this.handleResetLocal}
                style={{
                  backgroundColor: '#27272a',
                  color: '#d4d4d8',
                  border: '1px solid #3f3f46',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Limpar Sessão e Recarregar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
