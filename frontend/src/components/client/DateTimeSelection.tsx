import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface DateTimeSelectionProps {
    desiredDate: string;
    onDateChange: (date: string) => void;
    desiredTime: string;
    onTimeChange: (time: string) => void;
}

const DateTimeSelection: React.FC<DateTimeSelectionProps> = ({
    desiredDate,
    onDateChange,
    desiredTime,
    onTimeChange
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 pb-10 border-b border-gray-100">
            <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Calendar size={12} className="text-primary" /> Data Pretendida
                </label>
                <input
                    type="date"
                    required
                    value={desiredDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 shadow-sm text-secondary font-bold transition-all"
                />
            </div>
            <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Clock size={12} className="text-primary" /> Horário Desejado
                </label>
                <input
                    type="time"
                    required
                    step="900"
                    value={desiredTime}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 shadow-sm text-secondary font-bold transition-all"
                />
            </div>
        </div>
    );
};

export default DateTimeSelection;
