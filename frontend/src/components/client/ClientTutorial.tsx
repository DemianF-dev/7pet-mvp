import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ChevronRight, ChevronLeft, Sparkles,
    ArrowRight, PlayCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

export default function ClientTutorial() {
    const { user, updateUser, isTutorialActive, tutorialStep, setTutorial } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const steps = [
        {
            id: 'welcome',
            title: "Bem-vindo à 7Pet! 🏰",
            description: "Olá! Vamos te mostrar como usar o sistema para dar o melhor cuidado ao seu pet. Preparado para essa tour de luxo?",
            icon: <Sparkles className="text-primary w-12 h-12" />,
            image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=600",
            route: '/client/dashboard'
        },
        {
            id: 'pets-card',
            title: "Primeiro Passo: Seus Pets 🐕",
            description: "Para começarmos, precisamos conhecer seus amigos. Clique aqui para preencher os dados dos seus pets e montar orçamentos personalizados.",
            selector: '#tour-meus-pets',
            route: '/client/dashboard',
            indicator: "Clique neste card para continuar"
        },
        {
            id: 'add-pet',
            title: "Cadastrar um Pet ➕",
            description: "Aqui você gerencia seus pets. Clique em 'Novo Pet' para adicionar as informações. Isso é essencial para orçamentos precisos!",
            selector: '#tour-new-pet, #tour-first-pet',
            route: '/client/pets',
            indicator: "Clique em Novo Pet quando estiver pronto"
        },
        {
            id: 'quotes-card',
            title: "Solicitar Orçamentos 📄",
            description: "Agora que temos os pets, você pode solicitar orçamentos de SPA ou Transporte. É por aqui que a mágica acontece!",
            selector: '#tour-solicitar-orçamento',
            route: '/client/dashboard',
            indicator: "Vá para a área de orçamentos"
        },
        {
            id: 'contact-pref',
            title: "Preferência de Resposta 💬",
            description: "MUITO IMPORTANTE: Escolha como quer ser avisado sobre seu orçamento. Podemos te chamar pelo App ou WhatsApp!",
            selector: '#tour-communication',
            route: '/client/quote-request',
            indicator: "Sinalize sua preferência aqui"
        },
        {
            id: 'quotes-list',
            title: "Acompanhe tudo de perto 🔍",
            description: "Aqui você vê o status de cada pedido. Assim que aprovarmos, você será notificado imediatamente!",
            selector: '#sidemenu-orçamentos',
            route: '/client/quotes',
            indicator: "Fique de olho nos seus pedidos"
        },
        {
            id: 'agendamentos',
            title: "Agendamentos 📅",
            description: "Depois de aprovado, seus serviços marcados aparecerão aqui. Você nunca vai perder um horário!",
            selector: '#sidemenu-agendamentos',
            route: '/client/dashboard',
            indicator: "Sua agenda completa"
        },
        {
            id: 'pagamentos',
            title: "Pagamentos 💳",
            description: "Gerencie suas faturas e histórico de pagamentos de forma transparente e segura.",
            selector: '#sidemenu-pagamentos',
            route: '/client/dashboard',
            indicator: "Suas finanças pet"
        },
        {
            id: 'perfil',
            title: "Seu Perfil 👤",
            description: "Mantenha seus dados sempre atualizados e controle suas notificações aqui.",
            selector: '#sidemenu-meu-perfil',
            route: '/client/dashboard',
            indicator: "Edite sua conta"
        },
        {
            id: 'notifications',
            title: "Fique por dentro! 🔔",
            description: "Avisos importantes sobre seus pets e serviços chegam por aqui. Não esqueça de conferir!",
            selector: '#tour-notifications',
            route: '/client/dashboard',
            indicator: "Avisos e alertas"
        },
        {
            id: 'farewell',
            title: "Tudo Pronto! 🎉",
            description: "Agora você é um mestre no sistema 7Pet. Qualquer dúvida, nossa equipe está sempre à disposição. Divirta-se!",
            icon: <PlayCircle className="text-green-500 w-12 h-12" />,
            image: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=600",
            route: '/client/dashboard'
        }
    ];

    const currentStep = steps[tutorialStep] || steps[0];

    // Master Logic: Synchronize showTutorial preference with isTutorialActive
    useEffect(() => {
        if (!user) return;

        // If user wants tutorial and it's not active in the store, activate it!
        // We also check if we are NOT on a state where it was dismissed (isTutorialActive is false)
        // Actually, if user.showTutorial is true, it SHOULD be active.
        if (user.showTutorial === true && !isTutorialActive && tutorialStep < steps.length) {
            setTutorial(true, tutorialStep || 0);
        }

        // If user explicitly disabled it, ensure it's not active
        if (user.showTutorial === false && isTutorialActive) {
            setTutorial(false);
        }

    }, [user?.showTutorial, user?.id, isTutorialActive, tutorialStep, steps.length]);

    // Spotlight logic
    useEffect(() => {
        if (!isTutorialActive || !user) return;

        const updatePosition = () => {
            const selector = currentStep.selector;
            if (selector) {
                // Try specific ID first, then fallback
                const element = document.querySelector(selector);
                if (element) {
                    setTargetRect(element.getBoundingClientRect());
                } else {
                    setTargetRect(null);
                }
            } else {
                setTargetRect(null);
            }
        };

        const timer = setTimeout(updatePosition, 500);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [tutorialStep, location.pathname, isTutorialActive, user]);

    if (!isTutorialActive || !user) return null;

    const handleDismiss = async (permanently = false) => {
        setTutorial(false);
        if (permanently) {
            try {
                // Optimistic update
                const updatedUser = { ...user, showTutorial: false };
                updateUser(updatedUser);
                await api.patch('/auth/me', { showTutorial: false });
            } catch (err) {
                console.error('Erro ao desativar tutorial:', err);
            }
        }
    };

    const handleNext = () => {
        if (tutorialStep < steps.length - 1) {
            const nextStepIndex = tutorialStep + 1;
            const nextStep = steps[nextStepIndex];

            // Advance step
            setTutorial(true, nextStepIndex);

            // Navigate if needed
            if (nextStep.route && location.pathname !== nextStep.route) {
                navigate(nextStep.route);
            }
        } else {
            handleDismiss(true);
        }
    };

    const handlePrev = () => {
        if (tutorialStep > 0) {
            const prevStepIndex = tutorialStep - 1;
            const prevStep = steps[prevStepIndex];
            setTutorial(true, prevStepIndex);
            if (prevStep.route && location.pathname !== prevStep.route) {
                navigate(prevStep.route);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            {/* Spotlight Mask */}
            <AnimatePresence>
                {isTutorialActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] pointer-events-auto overflow-hidden"
                    >
                        {targetRect ? (
                            <svg className="w-full h-full">
                                <defs>
                                    <mask id="spotlight-mask">
                                        <rect width="100%" height="100%" fill="white" />
                                        <rect
                                            x={targetRect.left - 8}
                                            y={targetRect.top - 8}
                                            width={targetRect.width + 16}
                                            height={targetRect.height + 16}
                                            rx="16"
                                            fill="black"
                                            className="transition-all duration-500"
                                        />
                                    </mask>
                                </defs>
                                <rect
                                    width="100%"
                                    height="100%"
                                    fill="rgba(15, 23, 42, 0.8)"
                                    mask="url(#spotlight-mask)"
                                    style={{
                                        backdropFilter: 'blur(2px)',
                                        WebkitBackdropFilter: 'blur(2px)'
                                    }}
                                    onClick={() => handleDismiss(false)}
                                    className="cursor-pointer"
                                />
                            </svg>
                        ) : (
                            <div
                                onClick={() => handleDismiss(false)}
                                className="w-full h-full flex items-center justify-center bg-secondary/40 cursor-pointer"
                                style={{
                                    backdropFilter: 'blur(8px)',
                                    WebkitBackdropFilter: 'blur(8px)'
                                }}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tutorial Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={tutorialStep}
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    className={`z-[101] pointer-events-auto bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/20 transition-all duration-500 ${targetRect ? 'fixed bottom-10 right-10 w-[380px]' : 'w-[450px] relative'}`}
                >
                    {currentStep.image && (
                        <div className="h-40 relative">
                            <img src={currentStep.image} alt="Tutorial" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                        </div>
                    )}

                    <div className="p-8 relative">
                        {currentStep.icon && (
                            <div className="mb-4 flex justify-center">{currentStep.icon}</div>
                        )}
                        <h2 className="text-2xl font-black text-secondary mb-3 leading-tight">{currentStep.title}</h2>
                        <p className="text-gray-500 font-medium mb-8 text-sm leading-relaxed">{currentStep.description}</p>

                        {currentStep.indicator && (
                            <motion.div
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="mb-6 flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest bg-primary/5 p-3 rounded-xl border border-primary/10"
                            >
                                <ArrowRight size={14} className="animate-bounce-x" />
                                {currentStep.indicator}
                            </motion.div>
                        )}

                        <div className="flex items-center justify-between gap-4 mt-auto">
                            <button
                                onClick={() => handleDismiss(true)}
                                className="text-[10px] font-black text-gray-300 hover:text-red-400 uppercase tracking-widest transition-colors"
                            >
                                Desativar Guia
                            </button>

                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrev}
                                    disabled={tutorialStep === 0}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${tutorialStep === 0 ? 'bg-gray-50 text-gray-200 cursor-not-allowed' : 'bg-gray-100 text-secondary hover:bg-gray-200'}`}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm"
                                >
                                    {tutorialStep === steps.length - 1 ? 'Finalizar' : 'Entendi'}
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => handleDismiss(false)}
                        className="absolute top-4 right-4 text-gray-300 hover:text-secondary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
