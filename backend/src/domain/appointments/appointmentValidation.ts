export type AppointmentCreateInput = {
    customerId: string;
    petId: string;
    serviceIds?: string[];
    startAt: Date;
    category?: string;
    transport?: {
        origin?: string;
        destination?: string;
        requestedPeriod?: string;
    };
    performerId?: string;
    pickupProviderId?: string;
    dropoffProviderId?: string;
    quoteId?: string;
    overridePastDateCheck?: boolean;
};

export type AppointmentValidationIssue = {
    level: 'error' | 'warning';
    message: string;
    code?: string;
    appointmentDate?: string;
};

const MIN_LEAD_TIME_MS = 12 * 60 * 60 * 1000;

export const isLogisticsAppointment = (input: AppointmentCreateInput) => {
    return input.category === 'LOGISTICA' || (input.category === 'SPA' && !!input.transport);
};

export const validateAppointmentCreateInput = (input: AppointmentCreateInput, isStaff: boolean, now: Date) => {
    const issues: AppointmentValidationIssue[] = [];

    if (input.startAt < now) {
        if (!isStaff) {
            issues.push({
                level: 'error',
                message: '❌ Não é possível agendar para uma data/horário que já passou. Por favor, escolha uma data futura.'
            });
        } else if (!input.overridePastDateCheck) {
            issues.push({
                level: 'warning',
                code: 'PAST_DATE_WARNING',
                appointmentDate: input.startAt.toISOString(),
                message: `⚠️ ATENÇÃO: Você está tentando agendar para ${input.startAt.toLocaleString('pt-BR')} que já passou. Confirme se isso está correto.`
            });
        }
    }

    if (!isStaff && input.startAt.getTime() - now.getTime() < MIN_LEAD_TIME_MS) {
        issues.push({
            level: 'error',
            message: 'Agendamentos devem ser feitos com no mínimo 12h de antecedência.'
        });
    }

    if (isStaff && isLogisticsAppointment(input)) {
        if (!input.pickupProviderId) {
            issues.push({
                level: 'error',
                message: 'Obrigatório selecionar o motorista LEVA (Coleta).'
            });
        }
        if (!input.dropoffProviderId) {
            issues.push({
                level: 'error',
                message: 'Obrigatório selecionar o motorista TRAZ (Entrega).'
            });
        }
    }

    return issues;
};
