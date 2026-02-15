/**
 * Calcula o valor total de um agendamento baseado em:
 * - SPA: metadata.servicePricing (preços do orçamento)
 * - LOGISTICA: metadata.servicePricing OU transportSnapshot.totalAmount (fallback)
 */
export const calculateAppointmentTotal = (appointment: any): number => {
    if (!appointment) return 0;

    // Primeiro, tentar usar servicePricing (funciona para SPA e LOGISTICA)
    const servicePricing = appointment.metadata?.servicePricing || [];

    if (servicePricing.length > 0) {
        return servicePricing.reduce((sum: number, sp: any) =>
            sum + (parseFloat(sp.price || 0) - parseFloat(sp.discount || 0)), 0
        );
    }

    // Fallback para LOGISTICA: usar transportSnapshot
    if (appointment.category === 'LOGISTICA') {
        const snapshot = appointment.transportSnapshot || appointment.metadata?.transportSnapshot;
        return snapshot?.totalAmount || 0;
    }

    // Fallback para SPA: usar Service.basePrice
    if (appointment.category === 'SPA') {
        if (appointment.services && appointment.services.length > 0) {
            return appointment.services.reduce((sum: number, svc: any) =>
                sum + parseFloat(svc.basePrice || 0), 0
            );
        }
    }

    return 0;
};


/**
 * Formata valor monetário para BRL
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

/**
 * Extrai breakdown de valores de um agendamento (SPA ou LOGISTICA)
 */
export const getServicePricingBreakdown = (appointment: any): Array<{
    serviceId: string;
    serviceName: string;
    price: number;
    discount: number;
    total: number;
    isManual?: boolean;
    description?: string;
}> => {
    if (!appointment) return [];

    const servicePricing = appointment.metadata?.servicePricing || [];

    // Retornar breakdown baseado em servicePricing (funciona para SPA e LOGISTICA)
    if (servicePricing.length > 0) {
        return servicePricing.map((sp: any) => {
            const service = appointment.services?.find((s: any) => s.id === sp.serviceId);
            return {
                serviceId: sp.serviceId,
                serviceName: service?.name || sp.description || 'Serviço',
                price: parseFloat(sp.price || 0),
                discount: parseFloat(sp.discount || 0),
                total: parseFloat(sp.price || 0) - parseFloat(sp.discount || 0),
                isManual: sp.addedManually || false,
                description: sp.description
            };
        });
    }

    // Fallback para SPA: usar services com basePrice
    if (appointment.category === 'SPA' && appointment.services?.length > 0) {
        return appointment.services.map((s: any) => ({
            serviceId: s.id,
            serviceName: s.name,
            price: parseFloat(s.basePrice || 0),
            discount: 0,
            total: parseFloat(s.basePrice || 0),
            isManual: false
        }));
    }

    return [];
};

