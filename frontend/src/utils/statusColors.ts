/**
 * Global status colors for Quotes and Appointments.
 * Provides a consistent design system for status badges and indicators.
 */

export type QuoteStatus =
    | 'SOLICITADO'
    | 'EM_PRODUCAO'
    | 'CALCULADO'
    | 'ENVIADO'
    | 'APROVADO'
    | 'REJEITADO'
    | 'AGENDAR'
    | 'AGENDADO'
    | 'ENCERRADO'
    | 'FATURAR';

export type AppointmentStatus =
    | 'PENDENTE'
    | 'CONFIRMADO'
    | 'EM_ATENDIMENTO'
    | 'FINALIZADO'
    | 'CANCELADO'
    | 'NO_SHOW';

export const getQuoteStatusColor = (status: string | undefined | null) => {
    if (!status) return 'bg-gray-100 text-gray-600 border-gray-200';
    switch (status.toUpperCase()) {
        case 'SOLICITADO':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'EM_PRODUCAO':
            return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'CALCULADO':
            return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'ENVIADO':
            return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'APROVADO':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'REJEITADO':
            return 'bg-red-100 text-red-700 border-red-200';
        case 'AGENDAR':
            return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        case 'AGENDADO':
            return 'bg-teal-100 text-teal-700 border-teal-200';
        case 'ENCERRADO':
            return 'bg-gray-100 text-gray-400 border-gray-200 opacity-60';
        case 'FATURAR':
            return 'bg-orange-100 text-orange-700 border-orange-200 font-extrabold ring-1 ring-orange-400';
        default:
            return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

export const getAppointmentStatusColor = (status: string | undefined | null) => {
    if (!status) return 'bg-gray-100 text-gray-600 border-gray-200';
    switch (status.toUpperCase()) {
        case 'PENDENTE':
            return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'CONFIRMADO':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'EM_ATENDIMENTO':
            return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'FINALIZADO':
            return 'bg-teal-100 text-teal-700 border-teal-200';
        case 'CANCELADO':
            return 'bg-red-100 text-red-700 border-red-200';
        case 'NO_SHOW':
            return 'bg-gray-900 text-white border-gray-800 shadow-lg';
        default:
            return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};
