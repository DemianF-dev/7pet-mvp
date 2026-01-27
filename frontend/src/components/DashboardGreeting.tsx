import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface DashboardGreetingProps {
    name: string;
    subtitle?: string | React.ReactNode;
    isClient?: boolean;
}

const INSPIRATIONAL_MESSAGES = [
    "Eu confio em você.",
    "Você é o melhor.",
    "Se supere sempre.",
    "Você é sua melhor versão.",
    "Melhore sempre.",
    "Ame mais.",
    "Beba água.",
    "Hoje é um ótimo dia para vencer.",
    "Sua dedicação faz a diferença.",
    "Respire fundo e continue.",
    "O sucesso é construído todos os dias.",
    "Sua energia é contagiante.",
    "O impossível é só questão de opinião.",
    "Pequenos progressos geram grandes resultados.",
    "Faça acontecer.",
    "Você é capaz de coisas incríveis.",
    "Sorria, você está indo bem.",
    "Transforme desafios em oportunidades.",
    "Acredite no seu potencial.",
    "Faça do hoje um dia incrível.",
    "Sua atitude define sua altitude.",
    "Foco no objetivo.",
    "Inspire-se e inspire outros.",
    "Você é insubstituível.",
    "A excelência é um hábito.",
    "Descanse, mas não desista.",
    "Seja a mudança que você quer ver.",
    "Cultive bons pensamentos.",
    "A gratidão transforma tudo.",
    "Siga em frente com confiança.",
    "O melhor ainda está por vir."
];

export default function DashboardGreeting({ name, subtitle, isClient: _isClient = false }: DashboardGreetingProps) {
    void _isClient; // May be used for conditional rendering in future
    const message = useMemo(() => {
        const day = new Date().getDate();
        return INSPIRATIONAL_MESSAGES[(day - 1) % INSPIRATIONAL_MESSAGES.length];
    }, []);

    const firstName = name.split(' ')[0];

    return (
        <div className="flex flex-col">
            <motion.h1
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-4xl font-extrabold text-secondary dark:text-white tracking-tight"
            >
                Olá, <span className="text-primary underline decoration-wavy decoration-2 underline-offset-4 md:underline-offset-8 decoration-primary/50">{firstName}!</span>
            </motion.h1>

            <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-2 md:mt-3"
            >
                <p className="text-sm md:text-lg font-medium bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent inline-block">
                    {message}
                </p>
                {subtitle && (
                    <div className="text-gray-500 dark:text-gray-400 mt-1 text-xs md:text-sm font-medium">
                        {subtitle}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
