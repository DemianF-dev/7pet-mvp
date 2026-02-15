import { motion } from 'framer-motion';

const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
};

interface WebWeekGridProps {
    days: any[];
    onAppointmentClick: (apt: any) => void;
    onDateClick?: (date: Date) => void;
}

export default function WebWeekGrid({ days, onAppointmentClick, onDateClick }: WebWeekGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {days?.map((dayInfo) => (
                <div
                    key={dayInfo.date}
                    className={`rounded-[32px] overflow-hidden transition-all border ${isSameDay(new Date(dayInfo.date), new Date()) ? 'bg-primary/5 border-primary/20 shadow-lg ring-1 ring-primary/20' : 'bg-white border-gray-100 shadow-sm'}`}
                >
                    <div
                        className={`text-center py-5 border-b transition-colors cursor-pointer hover:bg-black/5 ${isSameDay(new Date(dayInfo.date), new Date()) ? 'bg-primary/10 border-primary/20' : 'bg-gray-50/50 border-gray-100'}`}
                        onClick={() => onDateClick?.(new Date(dayInfo.date))}
                    >
                        <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-1 ${isSameDay(new Date(dayInfo.date), new Date()) ? 'text-primary' : 'text-gray-400'}`}>
                            {new Date(dayInfo.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </p>
                        <p className={`text-2xl font-bold tracking-tighter ${isSameDay(new Date(dayInfo.date), new Date()) ? 'text-primary' : 'text-secondary'}`}>
                            {new Date(dayInfo.date).getDate()}
                        </p>
                    </div>

                    <div className="p-3 bg-white/40 min-h-[400px]">
                        {dayInfo.appointments?.length > 0 ? (
                            <div className="space-y-3">
                                {dayInfo.appointments.map((apt: any) => {
                                    const isCat = apt.pet?.species?.toUpperCase().includes('GATO');
                                    const isRecurring = apt.customer?.type === 'RECORRENTE';
                                    const isLog = apt.category === 'LOGISTICA';

                                    return (
                                        <motion.div
                                            key={apt.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-4 rounded-[24px] shadow-sm hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer group relative overflow-hidden border-2 border-transparent border-l-[8px] ${isLog ? 'bg-orange-50 border-l-orange-500 text-orange-900 border-orange-100' :
                                                isCat ? 'bg-pink-50 border-l-pink-500 text-pink-900 border-pink-100' :
                                                    'bg-blue-50 border-l-blue-500 text-blue-900 border-blue-100'
                                                }`}
                                            onClick={() => onAppointmentClick(apt)}
                                        >
                                            <div className="flex justify-between items-start mb-2.5">
                                                <div className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-current/10 text-[10px] font-bold uppercase tracking-tight">
                                                    {apt.startAt ? new Date(apt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </div>
                                                <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest bg-white/40 px-1.5 py-0.5 rounded-md">
                                                    AG-{String(apt.seqId || 0).padStart(4, '0')}
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                <h4 className="font-bold text-secondary text-base leading-tight group-hover:text-primary transition-colors uppercase tracking-tight truncate">
                                                    {apt.pet?.name || 'Pet'} {isRecurring ? '(R)' : '(A)'}
                                                </h4>
                                                <p className="text-[11px] opacity-60 font-bold truncate uppercase tracking-widest">
                                                    {apt.customer?.name}
                                                </p>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-current/5 space-y-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {(apt.services || (apt.service ? [apt.service] : [])).map((s: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-white/50 rounded-md border border-current/5 uppercase max-w-full">
                                                            <span className="truncate">{s.name}</span>
                                                            <span className="opacity-40">R$ {Number(s.basePrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    ))}
                                                    {apt.services?.length > 2 && <span className="text-[9px] font-bold opacity-40">+{apt.services.length - 2}</span>}
                                                </div>

                                                <div className="flex justify-between items-center bg-white/30 px-2 py-1 rounded-lg">
                                                    <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Total</span>
                                                    <span className="text-[11px] font-bold tabular-nums">
                                                        R$ {((apt.services || (apt.service ? [apt.service] : [])).reduce((acc: number, s: any) => acc + Number(s.basePrice || 0), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-20 opacity-10">
                                <div className="text-center">
                                    <div className="w-10 h-10 border-2 border-dashed border-gray-400 rounded-full mx-auto" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
