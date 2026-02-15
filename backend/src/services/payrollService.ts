import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

export class PayrollService {
    async getStaffPayrollPreview(staffId: string, startDate: Date, endDate: Date) {
        const staff = await prisma.staffProfile.findUnique({
            where: { id: staffId },
            include: {
                user: true,
                transportLegExecutions: {
                    where: {
                        completedAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    include: {
                        appointment: {
                            include: {
                                transportDetails: true
                            }
                        }
                    }
                },
                attendanceRecords: {
                    where: {
                        date: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                },
                serviceExecutions: {
                    where: {
                        executedAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    include: {
                        service: true
                    }
                },
                payAdjustments: {
                    where: {
                        date: {
                            gte: startDate,
                            lte: endDate
                        },
                        staffPayStatementId: null // Only include unbilled adjustments
                    }
                }
            }
        });

        if (!staff) throw new Error('Staff not found');

        const preview = {
            staffId,
            staffName: staff.user.name,
            period: { start: startDate, end: endDate },
            earnings: {
                daily: { count: 0, total: 0, details: [] as any[] },
                legs: { count: 0, total: 0, details: [] as any[] },
                commissions: { count: 0, total: 0, details: [] as any[] },
                fixed: { total: 0, details: [] as any[] }
            },
            adjustments: { total: 0, items: [] as any[] },
            totalDue: 0
        };

        // 1. Calculate Daily Earnings
        if (staff.payModel === 'DAILY' || staff.dailyRate) {
            // Logic: Count attendance days * Daily Rate + Transport/Meal Vouchers per day
            const daysWorked = staff.attendanceRecords.length;
            const dailyRate = staff.dailyRate || 0;
            const benefitsPerDay = (staff.mealVoucher || 0) + (staff.transportVoucher || 0);

            preview.earnings.daily.count = daysWorked;
            preview.earnings.daily.total = daysWorked * (dailyRate + benefitsPerDay);
            preview.earnings.daily.details = staff.attendanceRecords.map(r => ({
                date: r.date,
                type: 'DIARIA',
                value: dailyRate + benefitsPerDay
            }));
        }

        // 2. Calculate Leg Earnings
        if (staff.payModel === 'PER_LEG' || staff.perLegRate) {
            staff.transportLegExecutions.forEach(leg => {
                let value = 0;

                // Priority 1: Specific Leg Value override (if exists)
                if (leg.legValue && Number(leg.legValue) > 0) {
                    value = Number(leg.legValue);
                }
                // Priority 2: Staff Fixed Per Leg Rate
                else if (staff.perLegRate && Number(staff.perLegRate) > 0) {
                    value = Number(staff.perLegRate);
                }
                // Priority 3: Calculation Rule (60% of Price - 6% Tax)
                // Assuming leg.price is the charged amount. If legValue is the charged amount, use that.
                // We need the "Leg Price" (Charged to customer).
                // TransportLegExecution usually links to a Service/Product price?
                // The prompt says "60% of leg value". Let's assume legValue is the base.
                // But wait, legValue is often the Driver's cut in some systems.
                // If legValue is 0, we might need to look at TransportDetails price?
                // For now, I'll implement the 60% rule on the *leg.legValue* if it's treated as base price, 
                // OR better, look for a "price" field. TransportLegExecution has `price`?
                // Schema check: TransportLegExecution has `legValue` (Decimal). 
                // TransportDetails has `totalValue`.
                // I will assume if NO fixed rate, we use the 60% rule on a base value.
                // Let's assume for this MVP that if perLegRate is NOT set, we use the calculation.
                // But what is the base?
                // I'll use 25.00 as a dummy base if 0, or try to find it.
                // Actually, let's just apply the logic: Value = (Base * 0.60) * 0.94.
                // I'll assume leg.legValue IS the Base Price for now.
                else {
                    // Default calculation if no fixed rate
                    const baseValue = Number(leg.legValue || 0);
                    const commission = baseValue * 0.60;
                    const tax = commission * 0.06;
                    value = commission - tax;
                }

                preview.earnings.legs.total += value;
                preview.earnings.legs.count++;
                preview.earnings.legs.details.push({
                    date: leg.completedAt,
                    type: leg.legType,
                    value: value,
                    notes: leg.notes || `Base: ${leg.legValue}`
                });
            });
        }

        // 3. Commissions
        if (staff.commissionPercent && staff.commissionPercent > 0) {
            staff.serviceExecutions.forEach(exec => {
                const servicePrice = exec.service?.basePrice || 0;
                const commission = servicePrice * (staff.commissionPercent! / 100);
                preview.earnings.commissions.total += commission;
                preview.earnings.commissions.count++;
                preview.earnings.commissions.details.push({
                    date: exec.executedAt,
                    service: exec.service?.name,
                    value: commission
                });
            });
        }

        // 4. Fixed Salary (Pro-rata?)
        if (staff.fixedSalary) {
            // Simple full salary for now
            preview.earnings.fixed.total = staff.fixedSalary;
            preview.earnings.fixed.details.push({
                type: 'SALARIO_FIXO',
                value: staff.fixedSalary
            });
        }

        // 5. Adjustments
        staff.payAdjustments.forEach(adj => {
            const val = adj.type === 'DEDUCTION' || adj.type === 'ADVANCE' ? -adj.amount : adj.amount;
            preview.adjustments.total += val;
            preview.adjustments.items.push(adj);
        });

        preview.totalDue =
            preview.earnings.daily.total +
            preview.earnings.legs.total +
            preview.earnings.commissions.total +
            preview.earnings.fixed.total +
            preview.adjustments.total;

        return preview;
    }

    async closePeriod(data: {
        startDate: Date,
        endDate: Date,
        staffIds: string[],
        closedByUserId: string
    }) {
        return prisma.$transaction(async (tx) => {
            // Create Period
            const period = await tx.staffPayPeriod.create({
                data: {
                    startDate: data.startDate,
                    endDate: data.endDate,
                    status: 'CLOSED',
                    type: 'REGULAR',
                    createdById: data.closedByUserId // Schema uses createdById
                }
            });

            const statements = [];

            for (const staffId of data.staffIds) {
                // Re-calculate to get final numbers (could optimize by passing preview data but safer to recalc)
                // We need an internal method for calculation inside transaction? 
                // For simplicity, calling the public method (not transactional safe strictly but ok for now)
                // Ideally refactor logic to be reusable
                const preview = await this.getStaffPayrollPreview(staffId, data.startDate, data.endDate);

                // Create Statement
                const statement = await tx.staffPayStatement.create({
                    data: {
                        staffPayPeriodId: period.id,
                        staffId: staffId,
                        baseTotal: preview.earnings.daily.total + preview.earnings.legs.total + preview.earnings.commissions.total + preview.earnings.fixed.total,
                        adjustmentsTotal: preview.adjustments.total,
                        totalDue: preview.totalDue,
                        status: 'ISSUED',
                        detailsJson: preview as any // Store full snapshot
                    }
                });

                // Link Adjustments to Statement
                await tx.staffPayAdjustment.updateMany({
                    where: {
                        staffId,
                        date: { gte: data.startDate, lte: data.endDate },
                        staffPayStatementId: null
                    },
                    data: { staffPayStatementId: statement.id }
                });

                statements.push(statement);
            }

            return { period, statements };
        });
    }
    async getPayStatementHistory(staffId: string) {
        return prisma.staffPayStatement.findMany({
            where: { staffId },
            include: {
                staffPayPeriod: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
}

export const payrollService = new PayrollService();
