export interface QuoteAppointmentDependency {
    id: string;
    startAt: string;
    status: string;
    services?: string[];
    origin?: string;
    destination?: string;
}

export interface QuoteInvoiceDependency {
    id: string;
    amount: number;
    status: string;
    dueDate: string;
}

export interface QuoteDependencies {
    quote: {
        id: string;
        seqId: number;
        totalAmount: number;
        status: string;
    };
    appointments: {
        spa: QuoteAppointmentDependency[];
        transport: QuoteAppointmentDependency[];
    };
    invoice?: QuoteInvoiceDependency;
    canDelete: boolean;
    warnings: string[];
}

export interface CascadeDeleteOptions {
    deleteSpaAppointments: boolean;
    deleteTransportAppointments: boolean;
    deleteInvoice: boolean;
}
