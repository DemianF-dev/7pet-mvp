import React, { useMemo } from 'react';

interface Appointment {
    id: string;
    startAt: string;
    [key: string]: any;
}

interface MonthGridCompactProps {
    currentDate: Date;
    selectedDate: Date;
    appointments: Appointment[];
    onSelectDay: (date: Date) => void;
}

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

    // Calculate days with events for badge display
    const daysWithEvents = useMemo(() => {
        const map = new Map<string, number>();
        appointments.forEach(appt => {
            const date = new Date(appt.startAt);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            map.set(dateStr, (map.get(dateStr) || 0) + 1);
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
        <div className="bg-[#121212] pt-2 pb-4 shrink-0 select-none w-full">
            {/* Week Headers - with empty first column for week numbers */}
            <div className="grid grid-cols-8 mb-2 px-2">
                <div className="w-6"></div> {/* Empty space for week numbers */}
                {weekHeaders.map((wh, i) => (
                    <div
                        key={i}
                        className="text-center text-[11px] font-medium text-gray-500 uppercase tracking-wide"
                    >
                        {wh}
                    </div>
                ))}
            </div>

            {/* Calendar Grid - 6 rows */}
            {[0, 1, 2, 3, 4, 5].map((rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-8 px-2 mb-1">
                    {/* Week Number */}
                    <div className="flex items-center justify-center text-[10px] text-gray-600 font-medium w-6">
                        {weeks[rowIndex]}
                    </div>

                    {/* Days */}
                    {days.slice(rowIndex * 7, rowIndex * 7 + 7).map((day, dayIdx) => {
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = isSameDay(day, today);
                        const isSelected = isSameDay(day, selectedDate);

                        const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                        const hasEvents = (daysWithEvents.get(dateStr) || 0) > 0;

                        return (
                            <div
                                key={dayIdx}
                                className="flex flex-col items-center justify-center h-[40px] cursor-pointer"
                                onClick={() => onSelectDay(day)}
                            >
                                <div
                                    className={`
                                        w-[32px] h-[32px] flex items-center justify-center rounded-full text-[14px] transition-all
                                        ${isSelected
                                            ? 'bg-white text-black font-bold'
                                            : isToday
                                                ? 'text-blue-500 font-semibold'
                                                : isCurrentMonth
                                                    ? 'text-gray-200'
                                                    : 'text-gray-600'
                                        }
                                    `}
                                >
                                    {day.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
