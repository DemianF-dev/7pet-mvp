import { useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
    title: string;
    showBack?: boolean;
    onBack?: () => void;
    rightAction?: React.ReactNode;
}

export const MobileHeader = ({ title, showBack, onBack, rightAction }: MobileHeaderProps) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 transition-colors duration-200 h-[var(--header-height)] flex items-center px-4 mobile-safe-top">
            <div className="flex-1 flex items-center gap-3">
                {showBack && (
                    <button
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 active:scale-95 transition-all text-blue-600 dark:text-blue-400"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}
                <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white truncate">
                    {title}
                </h1>
            </div>

            {rightAction && (
                <div className="flex items-center gap-2">
                    {rightAction}
                </div>
            )}
        </header>
    );
};
