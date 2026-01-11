/**
 * ErrorBoundary - Catches React errors and displays fallback UI
 * Useful for debugging mobile issues
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('🔴 Error caught by boundary:', error);
        console.error('🔴 Error info:', errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        padding: '20px',
                        maxWidth: '600px',
                        margin: '40px auto',
                        textAlign: 'center',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                >
                    <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
                        Ops! Algo deu errado 😢
                    </h1>

                    <div
                        style={{
                            background: '#f5f5f5',
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            textAlign: 'left',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            overflow: 'auto'
                        }}
                    >
                        <strong>Erro:</strong>
                        <p style={{ color: '#d32f2f', marginTop: '8px' }}>
                            {this.state.error?.message || 'Unknown error'}
                        </p>

                        {this.state.error?.stack && (
                            <details style={{ marginTop: '12px' }}>
                                <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    Stack trace
                                </summary>
                                <pre style={{ fontSize: '12px', overflow: 'auto', marginTop: '8px' }}>
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            background: '#4B96C3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        🔄 Recarregar Página
                    </button>

                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            background: 'transparent',
                            color: '#4B96C3',
                            border: '1px solid #4B96C3',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            marginLeft: '12px'
                        }}
                    >
                        🏠 Ir para Início
                    </button>

                    <p style={{ marginTop: '24px', fontSize: '14px', color: '#666' }}>
                        Se o problema persistir, entre em contato com o suporte.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
