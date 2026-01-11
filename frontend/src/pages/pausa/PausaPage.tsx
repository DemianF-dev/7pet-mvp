/**
 * PausaPage - Landing page for mini-games
 * 
 * Premium Apple-like layout with liquid glass aesthetics.
 * Displays a grid of available games for the user to select.
 * Includes navigation controls (back + sidebar toggle).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, X, Home } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { GameMetadata } from '../../types/game.types';
import GameCard from '../../components/games/GameCard';
import '../../styles/design-system-base.css';

// Game catalog - Only Paciência available for now
const GAMES: GameMetadata[] = [
    {
        id: 'paciencia-pet',
        name: 'Paciência Pet',
        description: 'Um clássico jogo de cartas relaxante com tema pet.',
        icon: '🐾',
        difficulty: 'easy',
        estimatedTime: '5-10 min',
        status: 'active',
        tags: ['Cartas', 'Relaxante']
    }
];

export default function PausaPage() {
    const navigate = useNavigate();
    const [showNav, setShowNav] = useState(false);

    const handleGameSelect = (gameId: string) => {
        navigate(`/pausa/${gameId}`);
    };

    return (
        <div
            className="page-container animate-fade-in"
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
                        onClick={() => navigate(-1)}
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
                                    icon="🏠"
                                    label="Dashboard"
                                    onClick={() => { navigate('/staff/dashboard'); setShowNav(false); }}
                                />
                                <NavButton
                                    icon="👤"
                                    label="Meu Perfil"
                                    onClick={() => { navigate('/staff/profile'); setShowNav(false); }}
                                />
                                <NavButton
                                    icon="⚙️"
                                    label="Configurações"
                                    onClick={() => { navigate('/staff/settings'); setShowNav(false); }}
                                />
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main content with padding for fixed header */}
            <div
                className="page-content"
                style={{ paddingTop: 'calc(var(--space-6) + 60px)' }}
            >
                {/* Premium Header */}
                <div
                    className="page-header"
                    style={{
                        textAlign: 'center',
                        marginBottom: 'var(--space-10)'
                    }}
                >
                    <h1
                        className="page-title"
                        style={{
                            fontSize: 'var(--font-size-title1)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--space-3)',
                            letterSpacing: '-0.02em'
                        }}
                    >
                        🎮 Pausa
                    </h1>
                    <p
                        className="page-subtitle"
                        style={{
                            fontSize: 'var(--font-size-headline)',
                            color: 'var(--color-text-secondary)',
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}
                    >
                        Um respiro rápido. Sem bagunçar sua agenda.
                    </p>
                </div>

                {/* Game grid with premium cards */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 'var(--space-6)',
                        marginBottom: 'var(--space-12)'
                    }}
                    className="animate-slide-up"
                >
                    {GAMES.map((game) => (
                        <GameCard
                            key={game.id}
                            game={game}
                            onClick={() => handleGameSelect(game.id)}
                        />
                    ))}
                </div>

                {/* Footer message with glass surface */}
                <div
                    className="glass-surface"
                    style={{
                        textAlign: 'center',
                        padding: 'var(--space-6)',
                        borderRadius: 'var(--radius-xl)',
                        marginTop: 'auto'
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--font-size-body)',
                            fontWeight: 'var(--font-weight-medium)'
                        }}
                    >
                        <span style={{ fontSize: '1.5em', marginRight: 'var(--space-2)' }}>💡</span>
                        <strong>Dica:</strong> Seus jogos pausam automaticamente quando você troca de aba.
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

