import { motion } from 'framer-motion';

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
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all hover:scale-105"
                >
                    <div
                        className="text-center cursor-pointer hover:bg-gray-50 rounded-md p-1 transition-colors"
                        onClick={() => onDateClick?.(new Date(dayInfo.date))}
                    >
                        <p className="text-sm text-gray-500 font-medium">
                            {new Date(dayInfo.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                            {new Date(dayInfo.date).toLocaleDateString('pt-BR', {
                                weekday: 'narrow',
                                day: 'numeric',
                                month: 'long'
                            })}
                        </p>
                    </div>

                    {dayInfo.appointments?.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {dayInfo.appointments.map((apt: any) => (
                                <motion.div
                                    key={apt.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
                                    className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                                    onClick={() => onAppointmentClick(apt)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="text-xs text-gray-500">
                                                {apt.customer?.name}
                                                {apt.customer?.phone && (
                                                    <span className="text-xs text-gray-400"> • {apt.customer?.phone}</span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-900">{apt.service?.name}</span>
                                                {apt.services?.length > 1 && (
                                                    <span className="text-xs text-gray-500"> +{apt.services?.length - 1}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-gray-500">
                                            {apt.startAt ? new Date(apt.startAt).toLocaleTimeString('pt-BR', { hour: 'numeric', minute: 'numeric' }) : ''}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
