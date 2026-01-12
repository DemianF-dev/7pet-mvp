/**
 * DesenroscaPage - Wrapper for Desenrosca a Coleira game
 * 
 * Premium Apple-like layout with liquid glass aesthetics.
 * Uses GameHost to dynamically load and manage the game.
 * Includes navigation controls (back + sidebar toggle).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, X, Home } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import GameHost from '../../components/games/GameHost';
import { GameModule } from '../../types/game.types';
import '../../styles/design-system-base.css';

export default function DesenroscaPage() {
    const navigate = useNavigate();
    const [showNav, setShowNav] = useState(false);

    // Dynamic import function for the game module
    const loadDesenroscaGame = () =>
        import('../../games/desenrosca-coleira') as Promise<{ default: GameModule }>;

    return (
        <div
            className="page-container"
            style={{
                background: 'var(--color-bg-secondary)',
                minHeight: '100vh',
                position: 'relative'
            }}
        >
            {/* Fixed Navigation Header */}
            <div
                style={{
                    position: 'fixed',
                    top: 'var(--space-4)',
                    left: 'var(--space-4)',
                    right: 'var(--space-4)',
                    zIndex: 100,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pointerEvents: 'none'
                }}
            >
                {/* Left buttons group */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', pointerEvents: 'auto' }}>
                    {/* Menu toggle button */}
                    <button
                        onClick={() => setShowNav(!showNav)}
                        className="interactive"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '44px',
                            height: '44px',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
                            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
                            boxShadow: 'var(--shadow-md)',
                            color: 'var(--color-text-primary)',
                            cursor: 'pointer',
                            transition: 'all var(--duration-fast) var(--ease-out-apple)'
                        }}
                        aria-label="Menu de navegação"
                    >
                        {showNav ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    {/* Back button */}
                    <button
                        onClick={() => navigate('/pausa')}
                        className="interactive"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-2) var(--space-4)',
                            height: '44px',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
                            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
                            boxShadow: 'var(--shadow-md)',
                            color: 'var(--color-text-primary)',
                            fontSize: 'var(--font-size-body)',
                            fontWeight: 'var(--font-weight-medium)',
                            cursor: 'pointer',
                            transition: 'all var(--duration-fast) var(--ease-out-apple)'
                        }}
                    >
                        <ArrowLeft size={18} />
                        Voltar
                    </button>
                </div>

                {/* Home button (right side) */}
                <button
                    onClick={() => navigate('/')}
                    className="interactive"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-full)',
                        border: 'none',
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
                        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
                        boxShadow: 'var(--shadow-md)',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        transition: 'all var(--duration-fast) var(--ease-out-apple)'
                    }}
                    aria-label="Ir para página inicial"
                >
                    <Home size={20} />
                </button>
            </div>

            {/* Quick Navigation Overlay */}
            <AnimatePresence>
                {showNav && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNav(false)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0, 0, 0, 0.3)',
                                backdropFilter: 'blur(4px)',
                                WebkitBackdropFilter: 'blur(4px)',
                                zIndex: 90
                            }}
                        />

                        {/* Navigation Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                            className="glass-elevated"
                            style={{
                                position: 'fixed',
                                top: 'calc(var(--space-4) + 52px)',
                                left: 'var(--space-4)',
                                zIndex: 95,
                                padding: 'var(--space-4)',
                                borderRadius: 'var(--radius-xl)',
                                minWidth: '200px'
                            }}
                        >
                            <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                <NavButton
                                    icon="🎮"
                                    label="Jogos"
                                    onClick={() => { navigate('/pausa'); setShowNav(false); }}
                                />
                                <NavButton
                                    icon="🏠"
                                    label="Dashboard"
                                    onClick={() => { navigate('/staff/dashboard'); setShowNav(false); }}
                                />
                                <NavButton
                                    icon="👤"
                                    label="Meu Perfil"
                                    onClick={() => { navigate('/staff/profile'); setShowNav(false); }}
                                />
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main content with padding for fixed header */}
            <div
                className="page-content"
                style={{
                    paddingTop: 'calc(var(--space-6) + 60px)',
                    paddingBottom: 'var(--space-4)'
                }}
            >
                {/* Game container with liquid glass effect */}
                <div
                    className="glass-elevated animate-fade-in"
                    style={{
                        borderRadius: 'var(--radius-2xl)',
                        overflow: 'hidden',
                        minHeight: '600px',
                        position: 'relative'
                    }}
                >
                    <GameHost
                        gameLoader={loadDesenroscaGame}
                        options={{}}
                    />
                </div>

                {/* Premium footer hint */}
                <div
                    className="glass-surface"
                    style={{
                        textAlign: 'center',
                        marginTop: 'var(--space-6)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-xl)'
                    }}
                >
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-footnote)' }}>
                        💡 <strong>Dica:</strong> O jogo pausa automaticamente quando você troca de aba.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Quick navigation button component
function NavButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="interactive"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'all var(--duration-fast) var(--ease-out-apple)'
            }}
        >
            <span style={{ fontSize: '1.2em' }}>{icon}</span>
            {label}
        </button>
    );
}
