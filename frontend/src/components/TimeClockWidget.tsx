import { useState, useEffect } from 'react';
import { Clock, PlayCircle, StopCircle, Timer } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface AttendanceRecord {
    id: string;
    checkInAt: string | null;
    checkOutAt: string | null;
    workDuration: number | null;
    status: string;
    staff: {
        user: {
            name: string;
        };
    };
}

interface HourBank {
    balanceMinutes: number;
    formatted: {
        hours: number;
        minutes: number;
        isPositive: boolean;
        display: string;
    };
}

const TimeClockWidget: React.FC = () => {
    const [staffId, setStaffId] = useState<string | null>(null);
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [hourBank, setHourBank] = useState<HourBank | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [loading, setLoading] = useState(false);

    // Fetch staff profile to get staffId
    useEffect(() => {
        const fetchStaffProfile = async () => {
            try {
                const res = await api.get('/hr/staff-profiles/me');
                setStaffId(res.data.id);
            } catch (error) {
                console.error('Error fetching staff profile:', error);
            }
        };

        fetchStaffProfile();
    }, []);

    // Fetch today's attendance and hour bank
    useEffect(() => {
        if (!staffId) return;

        const fetchData = async () => {
            try {
                const [attendanceRes, bankRes] = await Promise.all([
                    api.get(`/time-tracking/attendance/today?staffId=${staffId}`),
                    api.get(`/time-tracking/hour-bank/balance?staffId=${staffId}`)
                ]);

                setTodayAttendance(attendanceRes.data);
                setHourBank(bankRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [staffId]);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Calculate elapsed time if checked in
    useEffect(() => {
        if (!todayAttendance?.checkInAt || todayAttendance?.checkOutAt) {
            setElapsedTime('00:00:00');
            return;
        }

        const calculateElapsed = () => {
            const checkInTime = new Date(todayAttendance.checkInAt!);
            const now = new Date();
            const diffMs = now.getTime() - checkInTime.getTime();
            const diffSeconds = Math.floor(diffMs / 1000);

            const hours = Math.floor(diffSeconds / 3600);
            const minutes = Math.floor((diffSeconds % 3600) / 60);
            const seconds = diffSeconds % 60;

            setElapsedTime(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        calculateElapsed();
        const timer = setInterval(calculateElapsed, 1000);

        return () => clearInterval(timer);
    }, [todayAttendance]);

    const handleCheckIn = async () => {
        if (!staffId) {
            toast.error('Perfil de colaborador não encontrado');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/time-tracking/attendance/check-in', { staffId });
            setTodayAttendance(res.data.attendance);
            toast.success(res.data.message || 'Check-in registrado!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao fazer check-in');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!staffId) {
            toast.error('Perfil de colaborador não encontrado');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/time-tracking/attendance/check-out', { staffId });
            setTodayAttendance(res.data.attendance);
            setHourBank(res.data.hourBank);
            toast.success(res.data.message || 'Check-out registrado!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao fazer check-out');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}min`;
    };

    if (!staffId) {
        return null; // Don't show widget if not a staff member
    }

    return (
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)', color: 'white' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Clock size={24} />
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Ponto Eletrônico</h3>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            {formatTime(currentTime)}
                        </p>
                    </div>
                </div>

                {/* Hour Bank Badge */}
                {hourBank && (
                    <div
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '12px',
                            background: hourBank.formatted.isPositive ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                            border: `2px solid ${hourBank.formatted.isPositive ? '#4ade80' : '#f87171'}`,
                            textAlign: 'center'
                        }}
                    >
                        <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>Banco de Horas</p>
                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>
                            {hourBank.formatted.display}
                        </p>
                    </div>
                )}
            </div>

            {/* Main Content */}
            {!todayAttendance?.checkInAt ? (
                // Not checked in yet
                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={handleCheckIn}
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '1.5rem',
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            background: 'white',
                            color: 'var(--primary)'
                        }}
                    >
                        <PlayCircle size={28} />
                        {loading ? 'Registrando...' : 'Iniciar Turno'}
                    </button>
                </div>
            ) : !todayAttendance.checkOutAt ? (
                // Checked in, not checked out
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
                            Turno iniciado às {formatDateTime(todayAttendance.checkInAt)}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <Timer size={20} />
                            <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                {elapsedTime}
                            </p>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                            Tempo decorrido
                        </p>
                    </div>

                    <button
                        onClick={handleCheckOut}
                        disabled={loading}
                        className="btn-success"
                        style={{
                            width: '100%',
                            padding: '1.5rem',
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            background: '#4ade80',
                            color: 'white'
                        }}
                    >
                        <StopCircle size={28} />
                        {loading ? 'Finalizando...' : 'Finalizar Turno'}
                    </button>
                </div>
            ) : (
                // Checked out
                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(74, 222, 128, 0.2)', borderRadius: '12px' }}>
                    <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold', color: '#4ade80' }}>
                        ✓ Turno Concluído
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                        {formatDateTime(todayAttendance.checkInAt!)} - {formatDateTime(todayAttendance.checkOutAt)}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', fontWeight: 600 }}>
                        Trabalhado: {formatMinutes(todayAttendance.workDuration || 0)}
                    </p>
                </div>
            )}
        </div>
    );
};

export default TimeClockWidget;
