import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Car, Scissors, CheckCircle, Clock, MapPin } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface PetTrackerProps {
    appointment: any;
}

export function PetTracker({ appointment }: PetTrackerProps) {
    if (!appointment) return null;

    // Determine current step
    const getStep = () => {
        const { status, transportDetails } = appointment;

        if (status === 'FINALIZADO') return 4;

        if (status === 'EM_ANDAMENTO') {
            if (transportDetails && transportDetails.status !== 'CONCLUIDO') {
                return 2; // Transporting
            }
            return 3; // In Service (Bath/Groom)
        }

        if (status === 'AGENDADO') return 1;

        return 0;
    };

    const currentStep = getStep();

    useEffect(() => {
        if (currentStep === 4) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);

            return () => clearInterval(interval);
        }
    }, [currentStep]);

    const steps = [
        { id: 1, label: 'Agendado', icon: Clock },
        { id: 2, label: 'Transporte', icon: Car },
        { id: 3, label: 'Banho & Tosa', icon: Scissors },
        { id: 4, label: 'Pronto!', icon: CheckCircle },
    ];

    return (
        <GlassCard className="mb-6 border-primary/20 bg-primary/5" gradient="none">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                        <MapPin size={18} className="text-primary" />
                        Acompanhe seu Pet
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                        Atualizado em tempo real: <span className="text-primary font-bold">{appointment.pet.name}</span>
                    </p>
                </div>
                <div className="px-3 py-1 bg-white rounded-full shadow-sm text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/10">
                    Status: {steps[currentStep - 1]?.label || 'Aguardando'}
                </div>
            </div>

            <div className="relative">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 rounded-full -translate-y-1/2 z-0" />

                {/* Active Progress Bar */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                    className="absolute top-1/2 left-0 h-1 bg-primary rounded-full -translate-y-1/2 z-0"
                />

                <div className="relative z-10 flex justify-between">
                    {steps.map((step) => {
                        const isActive = currentStep >= step.id;
                        const isCurrent = currentStep === step.id;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0.5 }}
                                    animate={{
                                        scale: isActive ? 1 : 0.8,
                                        opacity: isActive ? 1 : 0.5,
                                        backgroundColor: isActive ? 'var(--color-accent-primary)' : '#FFF'
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 ${isActive ? 'border-primary text-white' : 'border-gray-200 text-gray-300'}`}
                                >
                                    <step.icon size={18} />
                                </motion.div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                                    {step.label}
                                </span>
                                {isCurrent && (
                                    <motion.div
                                        layoutId="pulse"
                                        className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full"
                                        transition={{ repeat: Infinity, duration: 1 }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </GlassCard>
    );
}
