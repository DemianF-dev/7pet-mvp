import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
    path?: string;
    label?: string;
    className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ path, label = 'Voltar', className = '' }) => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => path ? navigate(path) : navigate(-1)}
            className={`flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all font-medium group ${className}`}
        >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            {label}
        </button>
    );
};

export default BackButton;
