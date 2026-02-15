import prisma from '../lib/prisma';

// ============================================
// STAFF PROFILE SERVICE
// ============================================

export async function createStaffProfile(data: {
    userId: string;
    department: 'spa' | 'transport' | 'atendimento' | 'gestao';
    payModel: 'daily' | 'per_leg' | 'fixed';
    dailyRate?: number;
    perLegRate?: number;
    transportVoucher?: number;
    mealVoucher?: number;
    otherBenefits?: number;
    payPeriodPreference?: 'weekly' | 'biweekly' | 'monthly' | 'custom';
}) {
    return prisma.staffProfile.create({
        data: {
            userId: data.userId,
            department: data.department,
            payModel: data.payModel,
            dailyRate: data.dailyRate,
            perLegRate: data.perLegRate,
            transportVoucher: data.transportVoucher,
            mealVoucher: data.mealVoucher,
            otherBenefits: data.otherBenefits,
            payPeriodPreference: data.payPeriodPreference || 'monthly',
        },
        include: { user: { select: { id: true, name: true, email: true } } }
    });
}

export async function updateStaffProfile(id: string, data: Partial<{
    department: string;
    payModel: string;
    dailyRate: number | null;
    perLegRate: number | null;
    transportVoucher: number | null;
    mealVoucher: number | null;
    otherBenefits: number | null;
    payPeriodPreference: string;
    isActive: boolean;
    hiringDate: Date | string | null;
    birthday: Date | string | null;
    address: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyContactRelation: string | null;
    cnhNumber: string | null;
    cnhCategory: string | null;
    cnhExpiry: Date | string | null;
    cnhEar: boolean;
    employmentType: string;
    documentType: string;
    documentNumber: string;
    companyName: string;
    pixKey: string;
    bankName: string;
    bankAgency: string;
    bankAccount: string;
    notes: string;
}>) {
    return prisma.staffProfile.update({
        where: { id },
        data,
        include: { user: { select: { id: true, name: true, email: true } } }
    });
}

export async function getStaffProfiles(filters?: { department?: string; isActive?: boolean }) {
    return prisma.staffProfile.findMany({
        where: {
            ...(filters?.department && { department: filters.department }),
            ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        },
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getStaffProfileByUserId(userId: string) {
    return prisma.staffProfile.findUnique({
        where: { userId },
        include: { user: { select: { id: true, name: true, email: true } } }
    });
}

// ============================================
// ATTENDANCE SERVICE
// ============================================

export async function checkIn(staffId: string, userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try to find existing record for today
    const existing = await prisma.attendanceRecord.findUnique({
        where: { staffId_date: { staffId, date: today } }
    });

    if (existing) {
        if (existing.checkInAt) {
            throw new Error('Já existe check-in para hoje');
        }
        return prisma.attendanceRecord.update({
            where: { id: existing.id },
            data: { checkInAt: new Date(), status: 'incomplete' }
        });
    }

    return prisma.attendanceRecord.create({
        data: {
            staffId,
            date: today,
            checkInAt: new Date(),
            status: 'incomplete',
            createdById: userId
        }
    });
}

export async function checkOut(staffId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await prisma.attendanceRecord.findUnique({
        where: { staffId_date: { staffId, date: today } }
    });

    if (!record) {
        throw new Error('Nenhum check-in encontrado para hoje');
    }

    if (!record.checkInAt) {
        throw new Error('Faça check-in primeiro');
    }

    if (record.checkOutAt) {
        throw new Error('Já existe check-out para hoje');
    }

    return prisma.attendanceRecord.update({
        where: { id: record.id },
        data: { checkOutAt: new Date(), status: 'ok' }
    });
}

export async function getTodayAttendance(staffId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.attendanceRecord.findUnique({
        where: { staffId_date: { staffId, date: today } }
    });
}

export async function getAttendanceRecords(filters: {
    staffId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    department?: string;
}) {
    return prisma.attendanceRecord.findMany({
        where: {
            ...(filters.staffId && { staffId: filters.staffId }),
            ...(filters.status && { status: filters.status }),
            ...(filters.startDate && filters.endDate && {
                date: { gte: filters.startDate, lte: filters.endDate }
            }),
            ...(filters.department && { staff: { department: filters.department } }),
        },
        include: {
            staff: {
                include: { user: { select: { id: true, name: true } } }
            }
        },
        orderBy: { date: 'desc' }
    });
}

export async function updateAttendance(
    id: string,
    data: { status?: string; checkInAt?: Date; checkOutAt?: Date; notes?: string },
    userId: string,
    reason: string
) {
    // Log audit
    await prisma.hrAuditLog.create({
        data: {
            actorUserId: userId,
            action: 'attendance.update',
            entityType: 'AttendanceRecord',
            entityId: id,
            metaJson: { reason, changes: data }
        }
    });

    return prisma.attendanceRecord.update({
        where: { id },
        data: {
            ...data,
            status: data.status || 'adjusted',
            updatedById: userId,
            updateReason: reason
        }
    });
}

// ============================================
// SERVICE EXECUTION (SPA Production)
// ============================================

export async function createServiceExecution(data: {
    appointmentId: string;
    staffId: string;
    serviceId?: string;
    notes?: string;
}) {
    return prisma.serviceExecution.create({
        data: {
            appointmentId: data.appointmentId,
            staffId: data.staffId,
            serviceId: data.serviceId,
            notes: data.notes
        }
    });
}

export async function getServiceExecutions(filters: {
    staffId?: string;
    startDate?: Date;
    endDate?: Date;
}) {
    return prisma.serviceExecution.findMany({
        where: {
            ...(filters.staffId && { staffId: filters.staffId }),
            ...(filters.startDate && filters.endDate && {
                executedAt: { gte: filters.startDate, lte: filters.endDate }
            })
        },
        include: {
            staff: { include: { user: { select: { name: true } } } },
            appointment: { include: { pet: true, customer: true } },
            service: true
        },
        orderBy: { executedAt: 'desc' }
    });
}

// ============================================
// TRANSPORT LEG EXECUTION
// ============================================

export async function createTransportLegExecution(data: {
    appointmentId: string;
    staffId: string;
    legType: 'pickup' | 'dropoff';
    legValue?: number;
    notes?: string;
}) {
    return prisma.transportLegExecution.create({
        data: {
            appointmentId: data.appointmentId,
            staffId: data.staffId,
            legType: data.legType,
            legValue: data.legValue,
            notes: data.notes
        }
    });
}

export async function getTransportLegExecutions(filters: {
    staffId?: string;
    startDate?: Date;
    endDate?: Date;
}) {
    return prisma.transportLegExecution.findMany({
        where: {
            ...(filters.staffId && { staffId: filters.staffId }),
            ...(filters.startDate && filters.endDate && {
                completedAt: { gte: filters.startDate, lte: filters.endDate }
            })
        },
        include: {
            staff: { include: { user: { select: { name: true } } } },
            appointment: {
                include: {
                    pet: true,
                    customer: true,
                    transportDetails: true,
                    quote: { select: { id: true, seqId: true, totalAmount: true } }
                }
            }
        },
        orderBy: { completedAt: 'desc' }
    });
}

// ============================================
// PAY PERIOD SERVICE
// ============================================

export async function createPayPeriod(data: {
    startDate: Date;
    endDate: Date;
    type: 'weekly' | 'biweekly' | 'monthly' | 'custom';
    createdById: string;
}) {
    return prisma.staffPayPeriod.create({
        data: {
            startDate: data.startDate,
            endDate: data.endDate,
            type: data.type,
            status: 'draft',
            createdById: data.createdById
        }
    });
}

export async function getPayPeriods(status?: string) {
    return prisma.staffPayPeriod.findMany({
        where: status ? { status } : undefined,
        include: {
            statements: { include: { staff: { include: { user: { select: { name: true } } } } } },
            adjustments: true
        },
        orderBy: { startDate: 'desc' }
    });
}

export async function closePayPeriod(periodId: string, userId: string) {
    // Log audit
    await prisma.hrAuditLog.create({
        data: {
            actorUserId: userId,
            action: 'pay_period.close',
            entityType: 'StaffPayPeriod',
            entityId: periodId,
            metaJson: {}
        }
    });

    return prisma.staffPayPeriod.update({
        where: { id: periodId },
        data: {
            status: 'closed',
            closedById: userId,
            closedAt: new Date()
        }
    });
}

export async function reopenPayPeriod(periodId: string, userId: string) {
    const period = await prisma.staffPayPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new Error('Período não encontrado');
    if (period.status !== 'closed') throw new Error('Período não está fechado');

    // Log audit
    await prisma.hrAuditLog.create({
        data: {
            actorUserId: userId,
            action: 'pay_period.reopen',
            entityType: 'StaffPayPeriod',
            entityId: periodId,
            metaJson: { reason: 'Reabertura manual pela diretoria' }
        }
    });

    return prisma.staffPayPeriod.update({
        where: { id: periodId },
        data: {
            status: 'draft',
            closedById: null,
            closedAt: null
        }
    });
}

// ============================================
// PAY ADJUSTMENT SERVICE
// ============================================

export async function createPayAdjustment(data: {
    staffPayPeriodId: string;
    staffId: string;
    type: 'advance' | 'bonus' | 'discount' | 'benefit' | 'correction';
    amount: number;
    direction: 'add' | 'subtract';
    reason: string;
    createdById: string;
}) {
    // Check period is draft
    const period = await prisma.staffPayPeriod.findUnique({ where: { id: data.staffPayPeriodId } });
    if (period?.status === 'closed') {
        throw new Error('Período já fechado. Não é possível adicionar ajustes.');
    }

    return prisma.staffPayAdjustment.create({
        data: {
            staffPayPeriodId: data.staffPayPeriodId,
            staffId: data.staffId,
            type: data.type,
            amount: Math.abs(data.amount),
            direction: data.direction,
            reason: data.reason,
            createdById: data.createdById
        }
    });
}

export async function getPayAdjustments(staffPayPeriodId: string, staffId?: string) {
    return prisma.staffPayAdjustment.findMany({
        where: {
            staffPayPeriodId,
            ...(staffId && { staffId })
        },
        include: {
            staff: { include: { user: { select: { name: true } } } }
        },
        orderBy: { createdAt: 'desc' }
    });
}

// ============================================
// PAY STATEMENT GENERATION
// ============================================

export async function generatePayStatements(staffPayPeriodId: string) {
    const period = await prisma.staffPayPeriod.findUnique({ where: { id: staffPayPeriodId } });
    if (!period) throw new Error('Período não encontrado');

    const staffProfiles = await prisma.staffProfile.findMany({
        where: { isActive: true }
    });

    const statements = [];

    for (const staff of staffProfiles) {
        const statement = await calculateStaffStatement(staff, period);

        // Upsert statement
        const saved = await prisma.staffPayStatement.upsert({
            where: {
                staffPayPeriodId_staffId: { staffPayPeriodId, staffId: staff.id }
            },
            create: {
                staffPayPeriodId,
                staffId: staff.id,
                baseTotal: statement.baseTotal,
                adjustmentsTotal: statement.adjustmentsTotal,
                totalDue: statement.totalDue,
                detailsJson: statement.details
            },
            update: {
                baseTotal: statement.baseTotal,
                adjustmentsTotal: statement.adjustmentsTotal,
                totalDue: statement.totalDue,
                detailsJson: statement.details,
                generatedAt: new Date()
            }
        });

        statements.push(saved);
    }

    return statements;
}

async function calculateStaffStatement(
    staff: {
        id: string;
        userId: string;
        department: string;
        payModel: string;
        dailyRate: number | null;
        perLegRate: number | null;
        transportVoucher: number | null;
        mealVoucher: number | null;
        otherBenefits: number | null;
    },
    period: { id: string; startDate: Date; endDate: Date }
) {
    let baseTotal = 0;
    const details: Record<string, any> = {
        department: staff.department,
        payModel: staff.payModel,
        periodStart: period.startDate,
        periodEnd: period.endDate
    };

    if (staff.payModel === 'daily') {
        // Count OK/adjusted days
        const attendanceDays = await prisma.attendanceRecord.count({
            where: {
                staffId: staff.id,
                date: { gte: period.startDate, lte: period.endDate },
                status: { in: ['ok', 'adjusted'] }
            }
        });

        details.daysWorked = attendanceDays;
        details.dailyRate = staff.dailyRate || 0;
        details.transportVoucher = staff.transportVoucher || 0;
        details.mealVoucher = staff.mealVoucher || 0;
        details.otherBenefits = staff.otherBenefits || 0;

        const dailyBase = (staff.dailyRate || 0);
        const dailyExtras = (staff.transportVoucher || 0) + (staff.mealVoucher || 0) + (staff.otherBenefits || 0);

        // Base total includes daily rate * days worked
        baseTotal = attendanceDays * dailyBase;

        // Extras total
        const extrasTotal = attendanceDays * dailyExtras;

        // We add extras to baseTotal for simplicity, but detail them in JSON
        baseTotal += extrasTotal;

        details.breakdown = {
            dailyRateTotal: attendanceDays * dailyBase,
            transportTotal: attendanceDays * (staff.transportVoucher || 0),
            mealTotal: attendanceDays * (staff.mealVoucher || 0),
            benefitsTotal: attendanceDays * (staff.otherBenefits || 0)
        };

        // Get service executions for reference (not for calculation)
        const executions = await prisma.serviceExecution.count({
            where: {
                staffId: staff.id,
                executedAt: { gte: period.startDate, lte: period.endDate }
            }
        });
        details.servicesExecuted = executions;
    } else if (staff.department === 'transport') {
        // --- MOTORIST RULE V2 (Leg Based) ---
        // Rule: (LegPrice - 6% taxes) * 60%

        const legs = await prisma.transportLeg.findMany({
            where: {
                providerId: staff.userId,
                appointment: {
                    status: 'FINALIZADO',
                    startAt: { gte: period.startDate, lte: period.endDate }
                }
            },
            include: {
                appointment: {
                    include: {
                        pet: true,
                        customer: true,
                        quote: true
                    }
                }
            }
        });

        details.legsCompleted = legs.length;
        let totalCommission = 0;
        let logs: string[] = [];

        for (const leg of legs) {
            const isLargada = leg.legType === 'PARTIDA'; // Simplified, could use more logic if needed

            if (isLargada) {
                // FIXED LARGADA FEE RULE
                const largadaFee = staff.perLegRate || 1.50;
                totalCommission += largadaFee;
                logs.push(`Pernada ${leg.id.substring(0, 4)}: Quote ${leg.appointment?.quote?.seqId} - TAXA DE LARGADA. Comm R$ ${largadaFee.toFixed(2)}`);
                continue;
            }

            // Apply Tax 6%
            const netValue = (leg.price || 0) * 0.94;

            // Apply Commission 60%
            const driverCommission = netValue * 0.60;

            totalCommission += driverCommission;

            logs.push(`Pernada ${leg.id.substring(0, 4)}: Quote ${leg.appointment?.quote?.seqId}, Tipo ${leg.legType}. Valor Base R$ ${(leg.price || 0).toFixed(2)}. Net R$ ${netValue.toFixed(2)}. Comm R$ ${driverCommission.toFixed(2)} - Pet: ${leg.appointment?.pet?.name}, Cliente: ${leg.appointment?.customer?.name}`);
        }

        baseTotal = totalCommission;
        details.calculationLogs = logs;
        details.totalCommission = totalCommission;

        // Add detailed production list for transparency
        details.productionDetails = legs.map((leg: any) => ({
            date: leg.appointment?.startAt || leg.createdAt,
            quoteSeqId: leg.appointment?.quote?.seqId,
            petName: leg.appointment?.pet?.name,
            customerName: leg.appointment?.customer?.name,
            legType: leg.legType,
            isLargada: leg.legType === 'PARTIDA',
            legPrice: leg.price,
            notes: `Leg ID: ${leg.id.substring(0, 8)}`
        }));

    } else if (staff.payModel === 'per_leg') {
        // Legacy/Generic Per Leg Model (if not Transport Department)
        const legs = await prisma.transportLegExecution.findMany({
            where: {
                staffId: staff.id,
                completedAt: { gte: period.startDate, lte: period.endDate }
            }
        });

        details.legsCompleted = legs.length;
        details.perLegRate = staff.perLegRate || 0;

        let legsWithValue = 0;
        let legsWithoutValue = 0;
        let totalFromCustomValues = 0;

        for (const leg of legs) {
            if (leg.legValue !== null) {
                totalFromCustomValues += leg.legValue;
                legsWithValue++;
            } else {
                legsWithoutValue++;
            }
        }

        baseTotal = totalFromCustomValues + (legsWithoutValue * (staff.perLegRate || 0));
        details.legsWithCustomValue = legsWithValue;
        details.legsWithDefaultRate = legsWithoutValue;
    } else if (staff.payModel === 'fixed') {
        // --- FIXED SALARY MODEL WITH PRORATING ---
        // Uses dailyRate as monthly fixed salary
        // Prorates if staff started/ended mid-period

        const monthlySalary = staff.dailyRate || 0;
        details.monthlySalary = monthlySalary;

        // Calculate total days in period
        const periodStart = new Date(period.startDate);
        const periodEnd = new Date(period.endDate);
        const totalDaysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Get staff hiring info
        const staffProfile = await prisma.staffProfile.findUnique({
            where: { id: staff.id },
            select: { hiringDate: true, isActive: true }
        });

        let effectiveStartDate = periodStart;
        let effectiveEndDate = periodEnd;
        let needsProrating = false;

        // Check if staff started during this period
        if (staffProfile?.hiringDate) {
            const hiringDate = new Date(staffProfile.hiringDate);
            if (hiringDate > periodStart && hiringDate <= periodEnd) {
                effectiveStartDate = hiringDate;
                needsProrating = true;
                details.proratingReason = 'Contratação no meio do período';
            }
        }

        // Calculate worked days in period
        const workedDays = Math.ceil((effectiveEndDate.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        details.totalDaysInPeriod = totalDaysInPeriod;
        details.workedDaysInPeriod = workedDays;
        details.effectiveStartDate = effectiveStartDate;
        details.effectiveEndDate = effectiveEndDate;

        if (needsProrating) {
            // Prorated calculation
            baseTotal = (monthlySalary / totalDaysInPeriod) * workedDays;
            details.prorated = true;
            details.prorateMultiplier = workedDays / totalDaysInPeriod;
        } else {
            // Full salary
            baseTotal = monthlySalary;
            details.prorated = false;
        }

        // Add benefits
        const transportBenefit = (staff.transportVoucher || 0) * workedDays;
        const mealBenefit = (staff.mealVoucher || 0) * workedDays;
        const otherBenefit = (staff.otherBenefits || 0) * workedDays;

        baseTotal += transportBenefit + mealBenefit + otherBenefit;

        details.breakdown = {
            salaryBase: needsProrating ? (monthlySalary / totalDaysInPeriod) * workedDays : monthlySalary,
            transportTotal: transportBenefit,
            mealTotal: mealBenefit,
            benefitsTotal: otherBenefit
        };

        // Get attendance for reference (não afeta cálculo no fixo, apenas para auditoria)
        const attendanceDays = await prisma.attendanceRecord.count({
            where: {
                staffId: staff.id,
                date: { gte: period.startDate, lte: period.endDate },
                status: { in: ['ok', 'adjusted'] }
            }
        });
        details.attendanceDaysForReference = attendanceDays;
    }

    // Calculate adjustments
    const adjustments = await prisma.staffPayAdjustment.findMany({
        where: {
            staffPayPeriodId: period.id,
            staffId: staff.id
        }
    });

    let adjustmentsTotal = 0;
    const adjustmentsList: any[] = [];

    for (const adj of adjustments) {
        const value = adj.direction === 'add' ? adj.amount : -adj.amount;
        adjustmentsTotal += value;
        adjustmentsList.push({
            type: adj.type,
            amount: adj.amount,
            direction: adj.direction,
            reason: adj.reason
        });
    }

    details.adjustments = adjustmentsList;

    return {
        baseTotal,
        adjustmentsTotal,
        totalDue: baseTotal + adjustmentsTotal,
        details
    };
}

export async function getPayStatements(staffPayPeriodId: string) {
    return prisma.staffPayStatement.findMany({
        where: { staffPayPeriodId },
        include: {
            staff: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
            staffPayPeriod: true
        },
        orderBy: { totalDue: 'desc' }
    });
}

export async function getPayStatement(id: string) {
    return prisma.staffPayStatement.findUnique({
        where: { id },
        include: {
            staff: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
            staffPayPeriod: { include: { adjustments: true } }
        }
    });
}

export async function getMyPayStatements(userId: string) {
    const staffProfile = await prisma.staffProfile.findUnique({
        where: { userId }
    });

    if (!staffProfile) return [];

    return prisma.staffPayStatement.findMany({
        where: { staffId: staffProfile.id },
        include: { staffPayPeriod: true },
        orderBy: { generatedAt: 'desc' }
    });
}


export default {
    createStaffProfile,
    updateStaffProfile,
    getStaffProfiles,
    getStaffProfileByUserId,
    checkIn,
    checkOut,
    getAttendanceRecords,
    updateAttendance,
    createServiceExecution,
    getServiceExecutions,
    createTransportLegExecution,
    getTransportLegExecutions,
    createPayPeriod,
    getPayPeriods,
    closePayPeriod,
    reopenPayPeriod,
    createPayAdjustment,
    getPayAdjustments,
    generatePayStatements,
    getPayStatements,
    getPayStatement,
    getMyPayStatements,
    getTodayAttendance
};
