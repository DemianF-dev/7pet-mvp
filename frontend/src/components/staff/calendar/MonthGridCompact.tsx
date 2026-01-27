import { useMemo } from 'react';

interface Appointment {
    id: string;
    startAt: string;
    status: string;
    [key: string]: any;
}

interface MonthGridCompactProps {
    currentDate: Date;
    selectedDate: Date;
    appointments: Appointment[];
    onSelectDay: (date: Date) => void;
}

type DayStatus = 'completed' | 'upcoming' | 'none';

export default function MonthGridCompact({
    currentDate,
    selectedDate,
    appointments,
    onSelectDay
}: MonthGridCompactProps) {
    // Helper: Check if two dates are the same day
    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    // Calculate days with events and their status
    const dayStatusMap = useMemo(() => {
        const map = new Map<string, DayStatus>();

        // Group appointments by day
        const dayGroups = new Map<string, Appointment[]>();

        appointments.forEach(appt => {
            const date = new Date(appt.startAt);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (!dayGroups.has(dateStr)) dayGroups.set(dateStr, []);
            dayGroups.get(dateStr)!.push(appt);
        });

        dayGroups.forEach((appts, dateStr) => {
            // Se algum não estiver concluído, a bolinha é verde (upcoming)
            // Se todos estiverem concluídos, a bolinha é branca (completed)
            const isAllCompleted = appts.every(a =>
                ['CONCLUIDO', 'CONCLUDED', 'COMPLETED', 'FINALIZADO'].includes(a.status?.toUpperCase())
            );

            map.set(dateStr, isAllCompleted ? 'completed' : 'upcoming');
        });

        return map;
    }, [appointments]);

    // Generate calendar grid (6 rows fixed)
    const { days, weeks } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // First day of the month
        const firstDayOfMonth = new Date(year, month, 1);

        // Find the start date (Monday)
        const dayOfWeek = firstDayOfMonth.getDay();
        const daysFromMonday = (dayOfWeek + 6) % 7; // Normalize to Mon=0, Sun=6

        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(firstDayOfMonth.getDate() - daysFromMonday);

        const daysArray: Date[] = [];
        const weeksArray: number[] = [];
        const current = new Date(startDate);

        // 6 rows * 7 cols = 42 days
        for (let i = 0; i < 42; i++) {
            if (i % 7 === 0) {
                // Calculate week number (ISO week)
                const d = new Date(current);
                d.setHours(0, 0, 0, 0);
                d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
                const week1 = new Date(d.getFullYear(), 0, 4);
                const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
                weeksArray.push(weekNum);
            }
            daysArray.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return { days: daysArray, weeks: weeksArray };
    }, [currentDate]);

    // Headers: S T Q Q S S D (Seg, Ter, Qua, Qui, Sex, Sab, Dom)
    const weekHeaders = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
    const today = new Date();

    return (
        <div className="bg-[var(--color-bg-primary)] pt-2 pb-4 shrink-0 select-none w-full border-b border-[var(--color-border)]">
            {/* Week Headers - with empty first column for week numbers */}
            <div className="grid grid-cols-8 mb-2 px-2">
                <div className="w-6"></div> {/* Empty space for week numbers */}
                {weekHeaders.map((wh, i) => (
                    <div
                        key={i}
                        className="text-center text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest"
                    >
                        {wh}
                    </div>
                ))}
            </div>

            {/* Calendar Grid - 6 rows */}
            {[0, 1, 2, 3, 4, 5].map((rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-8 px-2">
                    {/* Week Number */}
                    <div className="flex items-center justify-center text-[10px] text-[var(--color-text-tertiary)] opacity-50 font-medium w-6">
                        {weeks[rowIndex]}
                    </div>

                    {/* Days */}
                    {days.slice(rowIndex * 7, rowIndex * 7 + 7).map((day, dayIdx) => {
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = isSameDay(day, today);
                        const isSelected = isSameDay(day, selectedDate);

                        const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                        const status = dayStatusMap.get(dateStr) || 'none';

                        return (
                            <div
                                key={dayIdx}
                                className="flex flex-col items-center justify-center h-[42px] cursor-pointer"
                                onClick={() => onSelectDay(day)}
                            >
                                <div className="relative">
                                    <div
                                        className={`
                                            w-[34px] h-[34px] flex items-center justify-center rounded-full text-[14px] transition-all
                                            ${isSelected
                                                ? 'bg-[var(--color-accent-primary)] text-white font-black shadow-lg shadow-[var(--color-accent-primary)]/20'
                                                : isToday
                                                    ? 'text-[var(--color-accent-primary)] font-black border border-[var(--color-accent-primary)]/30'
                                                    : isCurrentMonth
                                                        ? 'text-[var(--color-text-primary)] font-medium'
                                                        : 'text-[var(--color-text-quaternary)] opacity-40'
                                            }
                                        `}
                                    >
                                        {day.getDate()}
                                    </div>

                                    {/* Indicators (Dots) */}
                                    {status !== 'none' && (
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                            <div
                                                className={`w-1.5 h-1.5 rounded-full shadow-sm ${status === 'completed'
                                                        ? 'bg-white border border-gray-200'
                                                        : 'bg-[#30d158] shadow-[0_0_5px_rgba(48,209,88,0.5)]'
                                                    }`}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

