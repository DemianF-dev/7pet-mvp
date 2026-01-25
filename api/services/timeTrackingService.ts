import prisma from '../lib/prisma';
import { Prisma } from '../generated';

// ============================================
// TIME TRACKING SERVICE
// ============================================

const EXPECTED_WORK_MINUTES = 8 * 60; // 8 hours = 480 minutes
const DEFAULT_BREAK_MINUTES = 60; // 1 hour

/**
 * Check-in: Register start of shift
 */
export async function checkIn(staffId: string, userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance record already exists for today
    const existing = await prisma.attendanceRecord.findUnique({
        where: {
            staffId_date: {
                staffId,
                date: today
            }
        }
    });

    const now = new Date();

    if (existing) {
        // If already checked out, don't allow re-check-in
        if (existing.checkOutAt) {
            throw new Error('Turno já foi finalizado. Não é possível fazer check-in novamente.');
        }

        // Update check-in time (allows re-checking in if needed)
        return prisma.attendanceRecord.update({
            where: { id: existing.id },
            data: {
                checkInAt: now,
                updatedById: userId
            },
            include: {
                staff: {
                    include: {
                        user: { select: { name: true } }
                    }
                }
            }
        });
    }

    // Create new attendance record
    return prisma.attendanceRecord.create({
        data: {
            staffId,
            date: today,
            checkInAt: now,
            status: 'incomplete',
            createdById: userId,
            ...(Prisma as any).ModelName === 'AttendanceRecord' ? { breakDuration: DEFAULT_BREAK_MINUTES } : {}
        } as any,
        include: {
            staff: {
                include: {
                    user: { select: { name: true } }
                }
            }
        }
    });
}

/**
 *Check-out: Register end of shift and calculate hours
 */
export async function checkOut(staffId: string, userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendanceRecord.findUnique({
        where: {
            staffId_date: {
                staffId,
                date: today
            }
        },
        include: {
            staff: {
                include: {
                    user: { select: { id: true, name: true } }
                }
            }
        }
    });

    if (!attendance) {
        throw new Error('Nenhum registro de check-in encontrado para hoje.');
    }

    if (!attendance.checkInAt) {
        throw new Error('Check-in não foi registrado.');
    }

    if (attendance.checkOutAt) {
        throw new Error('Check-out já foi registrado.');
    }

    const now = new Date();
    const checkInTime = new Date(attendance.checkInAt);
    const totalMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60));

    // Calculate work duration (total - break)
    const breakDur = (attendance as any).breakDuration ?? DEFAULT_BREAK_MINUTES;
    const workDuration = totalMinutes - breakDur;

    // Calculate overtime or undertime
    let overtimeMinutes = 0;
    let undertimeMinutes = 0;

    if (workDuration > EXPECTED_WORK_MINUTES) {
        overtimeMinutes = workDuration - EXPECTED_WORK_MINUTES;
    } else if (workDuration < EXPECTED_WORK_MINUTES) {
        undertimeMinutes = EXPECTED_WORK_MINUTES - workDuration;
    }

    // Update attendance record
    const updatedAttendance = await prisma.attendanceRecord.update({
        where: { id: attendance.id },
        data: {
            status: 'ok',
            updatedById: userId,
            workDuration,
            overtimeMinutes,
            undertimeMinutes
        } as any,
        include: {
            staff: {
                include: {
                    user: { select: { id: true, name: true } }
                }
            }
        }
    });

    // Update hour bank ONLY if department is NOT transport
    if (attendance.staff.department !== 'transport') {
        const minutesToAdd = overtimeMinutes > 0 ? overtimeMinutes : -undertimeMinutes;

        if (minutesToAdd !== 0) {
            await updateHourBank(
                staffId,
                minutesToAdd,
                overtimeMinutes > 0 ? 'EARN' : 'SPEND',
                `Turno de ${new Date(attendance.checkInAt).toLocaleDateString('pt-BR')}`,
                userId,
                undefined,
                attendance.id
            );
        }
    }

    // Fetch updated hour bank
    const hourBank = await getOrCreateHourBank(staffId);

    return {
        attendance: updatedAttendance,
        hourBank,
        message: `Turno finalizado. Trabalhou ${Math.floor(workDuration / 60)}h ${workDuration % 60}min.`
    };
}

/**
 * Get today's attendance for a staff member
 */
export async function getTodayAttendance(staffId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.attendanceRecord.findUnique({
        where: {
            staffId_date: {
                staffId,
                date: today
            }
        },
        include: {
            staff: {
                include: {
                    user: { select: { name: true } }
                }
            }
        }
    });
}

/**
 * Get attendance history for a staff member
 */
export async function getAttendanceHistory(
    staffId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50
) {
    const where: any = { staffId };

    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
    }

    const records = await prisma.attendanceRecord.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        include: {
            staff: {
                include: {
                    user: { select: { name: true } }
                }
            },
            ...((Prisma as any).ModelName === 'AttendanceRecord' ? { adjustedBy: { select: { name: true } } } : {})
        } as any
    });

    // Calculate summary
    const summary = {
        totalDays: records.filter(r => r.status === 'ok' || r.status === 'adjusted').length,
        totalMinutes: records.reduce((sum, r) => sum + ((r as any).workDuration || 0), 0),
        totalOvertimeMinutes: records.reduce((sum, r) => sum + ((r as any).overtimeMinutes || 0), 0),
        totalUndertimeMinutes: records.reduce((sum, r) => sum + ((r as any).undertimeMinutes || 0), 0)
    };

    summary.totalMinutes = Math.max(0, summary.totalMinutes);

    return { records, summary };
}

/**
 * Admin: Adjust attendance record
 */
export async function adjustAttendance(
    attendanceId: string,
    adminUserId: string,
    adjustments: {
        checkInAt?: Date;
        checkOutAt?: Date;
        breakDuration?: number;
        status?: string;
        adjustmentReason: string;
    }
) {
    const attendance = await prisma.attendanceRecord.findUnique({
        where: { id: attendanceId },
        include: { staff: true }
    });

    if (!attendance) {
        throw new Error('Registro de presença não encontrado.');
    }

    const checkInAt = adjustments.checkInAt || attendance.checkInAt;
    const checkOutAt = adjustments.checkOutAt || attendance.checkOutAt;
    const breakDuration = adjustments.breakDuration ?? ((attendance as any).breakDuration || DEFAULT_BREAK_MINUTES);

    if (!checkInAt || !checkOutAt) {
        throw new Error('Check-in e check-out são obrigatórios para ajuste.');
    }

    // Recalculate work duration and overtime/undertime
    const totalMinutes = Math.floor((checkOutAt.getTime() - checkInAt.getTime()) / (1000 * 60));
    const workDuration = totalMinutes - breakDuration;

    let overtimeMinutes = 0;
    let undertimeMinutes = 0;

    if (workDuration > EXPECTED_WORK_MINUTES) {
        overtimeMinutes = workDuration - EXPECTED_WORK_MINUTES;
    } else if (workDuration < EXPECTED_WORK_MINUTES) {
        undertimeMinutes = EXPECTED_WORK_MINUTES - workDuration;
    }

    // Calculate difference from previous values
    const previousOvertime = (attendance as any).overtimeMinutes || 0;
    const previousUndertime = (attendance as any).undertimeMinutes || 0;
    const overtimeDiff = overtimeMinutes - previousOvertime;
    const undertimeDiff = undertimeMinutes - previousUndertime;

    // Update attendance
    const updated = await prisma.attendanceRecord.update({
        where: { id: attendanceId },
        data: {
            checkInAt,
            checkOutAt,
            status: adjustments.status || 'adjusted',
            updatedById: adminUserId,
            // Extended fields cast via any to avoid TS errors if not in schema
            ...({
                breakDuration,
                workDuration,
                overtimeMinutes,
                undertimeMinutes,
                isAdjusted: true,
                adjustmentReason: adjustments.adjustmentReason,
                adjustedById: adminUserId,
                adjustedAt: new Date(),
            } as any)
        },
        include: {
            staff: {
                include: {
                    user: { select: { name: true } }
                }
            },
            // Condition for adjustedBy relation
            ...((Prisma as any).ModelName === 'AttendanceRecord' ? { adjustedBy: { select: { name: true } } } : {})
        } as any
    });

    // Adjust hour bank if there's a difference and department is NOT transport
    if (attendance.staff.department !== 'transport') {
        const totalDiff = overtimeDiff - undertimeDiff;

        if (totalDiff !== 0) {
            await updateHourBank(
                attendance.staffId,
                totalDiff,
                'ADMIN_ADJUST',
                `Ajuste administrativo: ${adjustments.adjustmentReason}`,
                adminUserId,
                undefined,
                attendanceId
            );
        }
    }

    return updated;
}

// ============================================
// HOUR BANK SERVICE
// ============================================

/**
 * Get or create hour bank for a staff member
 */
export async function getOrCreateHourBank(staffId: string) {
    let hourBank = await (prisma as any).hourBank?.findUnique({
        where: { staffId },
        include: {
            staff: {
                include: {
                    user: { select: { name: true } }
                }
            }
        }
    });

    if (!hourBank && (prisma as any).hourBank) {
        hourBank = await (prisma as any).hourBank.create({
            data: {
                staffId,
                balanceMinutes: 0
            },
            include: {
                staff: {
                    include: {
                        user: { select: { name: true } }
                    }
                }
            }
        });
    }

    return hourBank;
}

/**
 * Get hour bank balance
 */
export async function getHourBankBalance(staffId: string) {
    const hourBank = await getOrCreateHourBank(staffId);

    const totalHours = Math.floor(Math.abs(hourBank.balanceMinutes) / 60);
    const minutes = Math.abs(hourBank.balanceMinutes) % 60;
    const isPositive = hourBank.balanceMinutes >= 0;

    return {
        ...hourBank,
        formatted: {
            hours: totalHours,
            minutes,
            isPositive,
            display: `${isPositive ? '+' : '-'}${totalHours}h ${minutes}min`
        }
    };
}

/**
 * Get hour bank transactions
 */
export async function getHourBankTransactions(staffId: string, limit: number = 50) {
    if (!(prisma as any).hourBankTransaction) return [];
    return (prisma as any).hourBankTransaction.findMany({
        where: { staffId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            createdBy: { select: { name: true } },
            payPeriod: { select: { startDate: true, endDate: true } },
            attendance: { select: { date: true } }
        }
    });
}

/**
 * Update hour bank (internal function)
 */
async function updateHourBank(
    staffId: string,
    minutes: number,
    type: string,
    reason: string,
    createdById: string,
    payPeriodId?: string,
    attendanceId?: string
) {
    const hourBank = await getOrCreateHourBank(staffId);

    const balanceBefore = hourBank.balanceMinutes;
    const balanceAfter = balanceBefore + minutes;

    // Update hour bank balance
    await (prisma as any).hourBank?.update({
        where: { id: hourBank.id },
        data: { balanceMinutes: balanceAfter }
    });

    // Create transaction record
    if (!(prisma as any).hourBankTransaction) return null;
    return (prisma as any).hourBankTransaction.create({
        data: {
            hourBankId: hourBank.id,
            staffId,
            type,
            minutes,
            balanceBefore,
            balanceAfter,
            reason,
            payPeriodId,
            attendanceId,
            createdById
        },
        include: {
            createdBy: { select: { name: true } }
        }
    });
}

/**
 * Admin: Manual hour bank adjustment
 */
export async function adminAdjustHourBank(
    staffId: string,
    minutes: number,
    reason: string,
    adminUserId: string
) {
    if (!reason || reason.trim().length === 0) {
        throw new Error('Justificativa é obrigatória para ajustes manuais.');
    }

    const transaction = await updateHourBank(
        staffId,
        minutes,
        'ADMIN_ADJUST',
        reason,
        adminUserId
    );

    const updatedBank = await getOrCreateHourBank(staffId);

    return {
        transaction,
        hourBank: updatedBank
    };
}

/**
 * Process hour bank in pay period
 */
export async function processHourBankInPeriod(
    staffId: string,
    payPeriodId: string,
    action: 'pay' | 'discount' | 'bonus' | 'accumulate',
    adminUserId: string,
    bonusMultiplier: number = 1.5
) {
    const hourBank = await getOrCreateHourBank(staffId);
    const balance = hourBank.balanceMinutes;

    if (balance === 0) {
        throw new Error('Saldo do banco de horas está zerado. Nada a processar.');
    }

    if (action === 'accumulate') {
        // Just create a transaction record, don't change balance
        return updateHourBank(
            staffId,
            0,
            'CARRY_FORWARD',
            `Saldo acumulado para próximo período (${Math.floor(balance / 60)}h ${balance % 60}min)`,
            adminUserId,
            payPeriodId
        );
    }

    // For pay/discount/bonus, we need to calculate the value
    const staff = await prisma.staffProfile.findUnique({
        where: { id: staffId }
    });

    if (!staff) {
        throw new Error('Colaborador não encontrado.');
    }

    // Calculate hourly rate based on pay model
    let hourlyRate = 0;

    if (staff.payModel === 'daily' && staff.dailyRate) {
        hourlyRate = staff.dailyRate / 8; // Assume 8-hour day
    } else if (staff.payModel === 'fixed' && staff.dailyRate) {
        // For fixed salary, assume 220 hours per month (typical)
        hourlyRate = staff.dailyRate / 220;
    } else {
        throw new Error('Não foi possível calcular o valor da hora. Verifique a configuração de pagamento do colaborador.');
    }

    const hours = Math.abs(balance) / 60;
    let amount = hours * hourlyRate;

    let transactionType = '';
    let payAdjustmentType = '';
    let payAdjustmentDirection: 'add' | 'subtract' = 'add';

    switch (action) {
        case 'pay':
            if (balance < 0) {
                throw new Error('Não é possível pagar horas negativas. Use "descontar" ao invés.');
            }
            transactionType = 'PAY';
            payAdjustmentType = 'benefit';
            payAdjustmentDirection = 'add';
            break;

        case 'discount':
            if (balance > 0) {
                throw new Error('Não é possível descontar horas positivas. Use "pagar" ao invés.');
            }
            transactionType = 'DISCOUNT';
            payAdjustmentType = 'discount';
            payAdjustmentDirection = 'subtract';
            break;

        case 'bonus':
            if (balance < 0) {
                throw new Error('Não é possível bonificar horas negativas.');
            }
            transactionType = 'BONUS';
            payAdjustmentType = 'bonus';
            payAdjustmentDirection = 'add';
            amount *= bonusMultiplier;
            break;
    }

    // Create pay adjustment
    const payAdjustment = await prisma.payAdjustment.create({
        data: {
            payPeriodId,
            staffId,
            type: payAdjustmentType,
            amount: Math.abs(amount),
            direction: payAdjustmentDirection,
            reason: `${action === 'bonus' ? 'Bonificação' : action === 'pay' ? 'Pagamento' : 'Desconto'} de ${hours.toFixed(1)}h do banco de horas${action === 'bonus' ? ` (${bonusMultiplier}x)` : ''}`,
            createdById: adminUserId
        }
    });

    // Create hour bank transaction and zero the balance
    const transaction = await updateHourBank(
        staffId,
        -balance, // Invert to zero the balance
        transactionType,
        `Processado no período ${payPeriodId} - ${action}`,
        adminUserId,
        payPeriodId
    );

    const updatedBank = await getOrCreateHourBank(staffId);

    return {
        transaction,
        payAdjustment,
        hourBank: updatedBank,
        processedAmount: amount
    };
}

/**
 * Revert hour bank processing for a pay period (used when reopening)
 */
export async function revertHourBankProcessing(payPeriodId: string, adminUserId: string) {
    // 1. Find transactions linked to this period
    if (!(prisma as any).hourBankTransaction) return { count: 0 };
    const transactions = await (prisma as any).hourBankTransaction.findMany({
        where: { payPeriodId }
    });

    if (transactions.length === 0) return { count: 0 };

    // 2. Revert balances
    for (const tx of transactions) {
        const hourBank = await (prisma as any).hourBank?.findUnique({ where: { id: tx.hourBankId } });
        if (hourBank) {
            await (prisma as any).hourBank.update({
                where: { id: hourBank.id },
                data: { balanceMinutes: hourBank.balanceMinutes - tx.minutes }
            });
        }
    }

    // 3. Delete the transactions
    await (prisma as any).hourBankTransaction.deleteMany({
        where: { payPeriodId }
    });

    // 4. Delete associated PayAdjustments
    await prisma.payAdjustment.deleteMany({
        where: {
            payPeriodId,
            reason: { contains: 'banco de horas', mode: Prisma.QueryMode.insensitive }
        }
    });

    return { count: transactions.length };
}

export default {
    // Time tracking
    checkIn,
    checkOut,
    getTodayAttendance,
    getAttendanceHistory,
    adjustAttendance,

    // Hour bank
    getOrCreateHourBank,
    getHourBankBalance,
    getHourBankTransactions,
    adminAdjustHourBank,
    processHourBankInPeriod,
    revertHourBankProcessing
};
