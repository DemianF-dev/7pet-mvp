/**
 * Migration Script: Fix Transport Appointments Without Services
 * 
 * Este script corrige agendamentos de transporte (LOGISTICA) que foram criados
 * sem serviços vinculados. Ele:
 * 
 * 1. Encontra ou cria um serviço "Transporte"
 * 2. Vincula esse serviço a todos agendamentos LOGISTICA sem serviços
 * 3. Calcula e atribui o preço correto baseado no transportSnapshot do orçamento
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

interface TransportSnapshot {
    totalAmount?: number;
    breakdown?: TransportBreakdown;
}

function parsePrice(value: string | number | undefined): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    return parseFloat(value) || 0;
}

function calculateTransportLegPrice(
    snapshot: TransportSnapshot | null | undefined,
    transportType: string,
    legType: 'LEVA' | 'TRAZ'
): number {
    if (!snapshot?.breakdown) return snapshot?.totalAmount || 0;

    const breakdown = snapshot.breakdown;
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
    console.log('🔧 Starting Transport Appointment Migration...\n');

    // 1. Find or create Transport service
    let transportService = await prisma.service.findFirst({
        where: { name: { contains: 'Transporte', mode: 'insensitive' } }
    });

    if (!transportService) {
        console.log('📦 Creating Transport service...');
        transportService = await prisma.service.create({
            data: {
                name: 'Transporte',
                description: 'Serviço de transporte automático',
                duration: 30,
                basePrice: 0,
                category: 'LOGISTICA' as any
            }
        });
        console.log(`✅ Transport service created: ${transportService.id}\n`);
    } else {
        console.log(`✅ Found existing Transport service: ${transportService.id}\n`);
    }

    // 2. Find all LOGISTICA appointments without services
    const appointmentsToFix = await prisma.appointment.findMany({
        where: {
            category: 'LOGISTICA',
            services: { none: {} }
        },
        include: {
            quote: true,
            transportDetails: true
        }
    });

    console.log(`📋 Found ${appointmentsToFix.length} LOGISTICA appointments without services\n`);

    if (appointmentsToFix.length === 0) {
        console.log('✅ No appointments to fix!\n');
        return;
    }

    let fixed = 0;
    let errors = 0;

    for (const appt of appointmentsToFix) {
        try {
            console.log(`🔄 Processing appointment ${appt.id}...`);

            // Get transport snapshot from quote
            const quote = appt.quote;
            const transportSnapshot = (quote?.metadata as any)?.transportSnapshot as TransportSnapshot | undefined;
            const transportType = (quote as any)?.transportType || 'ROUND_TRIP';

            // Determine leg type from transportDetails
            const legType = appt.transportDetails?.type === 'TRAZ' ? 'TRAZ' : 'LEVA';

            // Calculate price
            const price = calculateTransportLegPrice(transportSnapshot, transportType, legType);

            console.log(`   - Transport Type: ${transportType}`);
            console.log(`   - Leg Type: ${legType}`);
            console.log(`   - Calculated Price: R$ ${price.toFixed(2)}`);

            // Update appointment with service and pricing
            await prisma.appointment.update({
                where: { id: appt.id },
                data: {
                    services: {
                        connect: { id: transportService.id }
                    },
                    metadata: {
                        ...(appt.metadata as any || {}),
                        transportSnapshot: transportSnapshot,
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

            console.log(`   ✅ Fixed!\n`);
            fixed++;
        } catch (err) {
            console.error(`   ❌ Error: ${err}\n`);
            errors++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Migration Summary:`);
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   Total: ${appointmentsToFix.length}`);
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
