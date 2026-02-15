/**
 * Migration Script v2: Fix Transport Appointments Pricing
 * 
 * Este script corrige os preços dos agendamentos de transporte (LOGISTICA).
 * Usa Quote.activeSnapshot (tabela TransportPricingSnapshot) para obter o breakdown real.
 * 
 * REGRAS DE PREÇO:
 * - PICK_UP (Só Leva): largada + leva + retorno
 * - DROP_OFF (Só Traz): largada + traz + retorno
 * - ROUND_TRIP (Leva & Traz):
 *   - LEVA: largada + leva
 *   - TRAZ: traz + retorno
 */

import prisma from '../src/lib/prisma';

interface TransportBreakdown {
    largada?: { price: string | number };
    leva?: { price: string | number };
    traz?: { price: string | number };
    retorno?: { price: string | number };
}

interface SnapshotData {
    breakdown?: TransportBreakdown;
    totalAmount?: number;
}

function parsePrice(value: string | number | undefined): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    return parseFloat(value) || 0;
}

function calculateTransportLegPrice(
    snapshotData: SnapshotData | null | undefined,
    totalAmount: number,
    transportType: string,
    legType: 'LEVA' | 'TRAZ'
): number {
    if (!snapshotData?.breakdown) {
        // Fallback: use totalAmount divided by 2 for round trip
        if (transportType === 'ROUND_TRIP') {
            return totalAmount / 2;
        }
        return totalAmount;
    }

    const breakdown = snapshotData.breakdown;
    const largada = parsePrice(breakdown.largada?.price);
    const leva = parsePrice(breakdown.leva?.price);
    const traz = parsePrice(breakdown.traz?.price);
    const retorno = parsePrice(breakdown.retorno?.price);

    // Só Leva: all components
    if (transportType === 'PICK_UP') {
        return largada + leva + retorno;
    }

    // Só Traz: all components
    if (transportType === 'DROP_OFF') {
        return largada + traz + retorno;
    }

    // Leva & Traz (Round Trip): split correctly
    if (legType === 'LEVA') {
        return largada + leva;
    } else {
        return traz + retorno;
    }
}

async function main() {
    console.log('🔧 Starting Transport Appointment Pricing Fix (v2)...\n');

    // 1. Find Transport service
    const transportService = await prisma.service.findFirst({
        where: { name: { contains: 'Transporte', mode: 'insensitive' } }
    });

    if (!transportService) {
        console.log('❌ Transport service not found. Run fix-transport-appointments.ts first.');
        return;
    }
    console.log(`✅ Found Transport service: ${transportService.id}\n`);

    // 2. Find quotes with transport snapshots
    const quotesWithSnapshots = await prisma.quote.findMany({
        where: {
            type: { in: ['TRANSPORTE', 'SPA_TRANSPORTE'] },
            activeSnapshotId: { not: null }
        },
        select: {
            id: true,
            transportType: true,
            activeSnapshot: {
                select: {
                    totalAmount: true,
                    data: true
                }
            },
            appointments: {
                where: { category: 'LOGISTICA' },
                include: {
                    transportDetails: true
                }
            }
        }
    });

    console.log(`📋 Found ${quotesWithSnapshots.length} quotes with active transport snapshots\n`);

    let fixed = 0;
    let errors = 0;

    for (const quote of quotesWithSnapshots) {
        const snapshot = quote.activeSnapshot;
        if (!snapshot) continue;

        const transportType = quote.transportType || 'ROUND_TRIP';
        const snapshotData = snapshot.data as SnapshotData;

        console.log(`📄 Quote ${quote.id.slice(0, 8)}...`);
        console.log(`   - Transport Type: ${transportType}`);
        console.log(`   - Snapshot Total: R$ ${snapshot.totalAmount?.toFixed(2) || '0.00'}`);
        console.log(`   - Has Breakdown: ${!!snapshotData?.breakdown}`);

        for (const appt of quote.appointments) {
            try {
                const legType = appt.transportDetails?.type === 'TRAZ' ? 'TRAZ' : 'LEVA';
                const price = calculateTransportLegPrice(
                    snapshotData,
                    snapshot.totalAmount || 0,
                    transportType,
                    legType
                );

                console.log(`   🔄 Appt ${appt.id.slice(0, 8)} (${legType}): R$ ${price.toFixed(2)}`);

                // Update appointment metadata with correct pricing
                await prisma.appointment.update({
                    where: { id: appt.id },
                    data: {
                        metadata: {
                            ...(appt.metadata as any || {}),
                            transportSnapshot: snapshotData,
                            servicePricing: [{
                                serviceId: transportService.id,
                                price: price,
                                discount: 0,
                                sourceQuoteItemId: null,
                                description: `Transporte (${legType})`
                            }]
                        }
                    }
                });

                fixed++;
            } catch (err) {
                console.error(`   ❌ Error: ${err}`);
                errors++;
            }
        }
        console.log('');
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Pricing Fix Summary:`);
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('='.repeat(50));
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
