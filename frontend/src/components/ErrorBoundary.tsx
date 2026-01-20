/**
 * ErrorBoundary - Enhanced Error Boundary with Role-Aware Display
 * 
 * Catches React errors and displays fallback UI.
 * - MASTER users: See full technical details and stack traces
 * - Other users: See friendly error message with recovery options
 * 
 * Prevents white screens and provides recovery mechanisms.
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    userRole?: string; // Optional: pass from parent if needed
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
        console.error('🔴 Component stack:', errorInfo.componentStack);
        this.setState({ errorInfo });

        // Log to external service if configured (e.g., Sentry)
        // sendErrorReport(error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        // Try to get user role from localStorage (Zustand persist)
        let userRole = this.props.userRole;
        if (!userRole) {
            try {
                const authStorage = localStorage.getItem('7pet-auth-storage');
                if (authStorage) {
                    const parsed = JSON.parse(authStorage);
                    userRole = parsed.state?.user?.role;
                }
            } catch (err) {
                // If we can't access role, show basic error
                console.warn('Could not determine user role:', err);
            }
        }

        const isMaster = userRole === 'MASTER';
        const errorMessage = this.state.error?.message || 'Erro desconhecido';
        const stackTrace = this.state.error?.stack;

        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    backgroundColor: 'var(--bg-primary, #f5f5f5)',
                    fontFamily: 'var(--font-family, system-ui, -apple-system, sans-serif)'
                }}
            >
                <div
                    style={{
                        maxWidth: '600px',
                        width: '100%',
                        textAlign: 'center'
                    }}
                >
                    {/* Error Icon */}
                    <div
                        style={{
                            fontSize: '64px',
                            marginBottom: '24px',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}
                    >
                        😢
                    </div>

                    {/* Title */}
                    <h1
                        style={{
                            fontSize: '28px',
                            fontWeight: '600',
                            marginBottom: '12px',
                            color: 'var(--text-primary, #333)'
                        }}
                    >
                        Ops! Algo deu errado
                    </h1>

                    {/* Description */}
                    <p
                        style={{
                            fontSize: '16px',
                            color: 'var(--text-secondary, #666)',
                            marginBottom: '32px',
                            lineHeight: '1.5'
                        }}
                    >
                        {isMaster
                            ? 'Um erro inesperado ocorreu. Detalhes técnicos abaixo.'
                            : 'Encontramos um problema inesperado. Nossa equipe foi notificada.'}
                    </p>

                    {/* Error Details (Master only) */}
                    {isMaster && (
                        <div
                            style={{
                                background: 'var(--bg-surface, #fff)',
                                border: '1px solid var(--border-color, #e0e0e0)',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '24px',
                                textAlign: 'left',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    marginBottom: '12px',
                                    color: 'var(--text-primary, #333)'
                                }}
                            >
                                🔍 Detalhes Técnicos (MASTER)
                            </div>

                            <div
                                style={{
                                    fontSize: '13px',
                                    fontFamily: 'monospace',
                                    color: 'var(--error, #d32f2f)',
                                    marginBottom: '16px',
                                    padding: '12px',
                                    background: 'var(--bg-error-subtle, #fef2f2)',
                                    borderRadius: '8px',
                                    overflowX: 'auto'
                                }}
                            >
                                <strong>Error:</strong> {errorMessage}
                            </div>

                            {stackTrace && (
                                <details style={{ marginTop: '12px' }}>
                                    <summary
                                        style={{
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            color: 'var(--text-secondary, #666)',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        📋 Stack Trace (clique para expandir)
                                    </summary>
                                    <pre
                                        style={{
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            overflow: 'auto',
                                            marginTop: '12px',
                                            padding: '12px',
                                            background: 'var(--bg-secondary, #fafafa)',
                                            borderRadius: '8px',
                                            lineHeight: '1.4',
                                            maxHeight: '300px'
                                        }}
                                    >
                                        {stackTrace}
                                    </pre>
                                </details>
                            )}

                            {this.state.errorInfo?.componentStack && (
                                <details style={{ marginTop: '12px' }}>
                                    <summary
                                        style={{
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            color: 'var(--text-secondary, #666)',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        🧩 Component Stack
                                    </summary>
                                    <pre
                                        style={{
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            overflow: 'auto',
                                            marginTop: '12px',
                                            padding: '12px',
                                            background: 'var(--bg-secondary, #fafafa)',
                                            borderRadius: '8px',
                                            lineHeight: '1.4',
                                            maxHeight: '200px'
                                        }}
                                    >
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}
                    >
                        <button
                            onClick={this.handleReload}
                            style={{
                                padding: '14px 28px',
                                fontSize: '16px',
                                fontWeight: '600',
                                background: 'var(--primary, #4B96C3)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'transform 0.1s, box-shadow 0.2s',
                                boxShadow: '0 2px 8px rgba(75, 150, 195, 0.3)'
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'scale(0.98)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            🔄 Recarregar Página
                        </button>

                        <button
                            onClick={this.handleGoHome}
                            style={{
                                padding: '14px 28px',
                                fontSize: '16px',
                                fontWeight: '600',
                                background: 'transparent',
                                color: 'var(--primary, #4B96C3)',
                                border: '2px solid var(--primary, #4B96C3)',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'transform 0.1s, background 0.2s'
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'scale(0.98)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            🏠 Ir para Início
                        </button>
                    </div>

                    {/* Support Message */}
                    <p
                        style={{
                            marginTop: '32px',
                            fontSize: '14px',
                            color: 'var(--text-tertiary, #999)',
                            lineHeight: '1.5'
                        }}
                    >
                        {isMaster
                            ? '💡 Dica: Verifique o console do navegador para mais detalhes.'
                            : 'Se o problema persistir, entre em contato com o suporte.'}
                    </p>
                </div>

                {/* Pulse animation */}
                <style>
                    {`
                        @keyframes pulse {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.6; }
                        }
                    `}
                </style>
            </div>
        );
    }
}

export default ErrorBoundary;
