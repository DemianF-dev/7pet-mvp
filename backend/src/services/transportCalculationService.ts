import prisma from '../lib/prisma';
import { mapsService } from './googleMapsService';
import crypto from 'crypto';

/**
 * Transport Calculation Service
 * Handles all TL1/TL2 transport pricing calculations with leg breakdown
 */

export type TransportPlan = 'TL1' | 'TL2';
export type TransportMode = 'LEVA' | 'TRAZ' | 'LEVA_TRAZ';
export type LegKind = 'PARTIDA' | 'LEVA' | 'LEVA2' | 'TRAZ' | 'TRAZ2' | 'RETORNO';

interface CalculateTransportParams {
    plan: TransportPlan;
    mode: TransportMode;
    destinationIsThePet: boolean;
    address1: string;           // Client/origin address
    address2?: string;          // Destination address (required for TL2)
    stopAddress?: string;       // Optional intermediate stop
    discountPercent?: number;
}

interface TransportLegData {
    kind: LegKind;
    originAddress: string;
    destinationAddress: string;
    distanceKm: number;
    durationMin: number;
    chargeKm: number;           // KM to be charged (sometimes = distanceKm)
    chargeMin: number;          // MIN to be charged (sometimes = 0)
    kmRate: number;
    minRate: number;
    subtotal: number;
}

interface TransportCalculationResult {
    ok: boolean;
    legs: TransportLegData[];
    totals: {
        totalBeforeDiscount: number;
        totalAfterDiscount: number;
        discountApplied: number;
        totalLevaBeforeDiscount?: number;
        totalLevaAfterDiscount?: number;
        totalTrazBeforeDiscount?: number;
        totalTrazAfterDiscount?: number;
    };
    settings: {
        kmRate: number;
        minRate: number;
        taxPercent: number;
        providerSharePercent: number;
    };
}

const STORE_ADDRESS = "Av Hildebrando de Lima 525, km18, Osasco";
const CACHE_TTL_DAYS = 7;

/**
 * Generate cache key for route
 */
function generateRouteKey(origin: string, dest: string, stop?: string, plan?: string): string {
    const data = `${origin}|${dest}|${stop || ''}|${plan || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Get cached route or fetch from Google Maps
 */
async function getRouteWithCache(
    origin: string,
    destination: string,
    stopAddress?: string
): Promise<{ distanceKm: number; durationMin: number }> {
    const routeKey = generateRouteKey(origin, destination, stopAddress);

    // Check cache first
    const cached = await (prisma as any).routeCache.findUnique({
        where: { routeKey }
    });

    const now = new Date();
    if (cached && cached.expiresAt > now) {
        console.log(`[TransportCalc] Using cached route: ${routeKey.substring(0, 12)}...`);
        return {
            distanceKm: cached.distanceKm,
            durationMin: cached.durationMin
        };
    }

    // Cache miss or expired - fetch from Google Maps
    console.log(`[TransportCalc] Fetching from Google Maps: ${origin} -> ${destination}`);

    // TODO: If stopAddress is provided, need to calculate route with waypoint
    // For now, direct route only
    const result = await mapsService.calculateTransportDetailed(origin, destination, 'PICK_UP');

    // Extract distance/duration from first leg
    const firstLeg = result.breakdown.largada;
    if (!firstLeg) {
        throw new Error('Failed to get route data from Google Maps');
    }

    const distanceKm = firstLeg.distanceKm;
    const durationMin = firstLeg.durationMin;

    // Save to cache
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

    await (prisma as any).routeCache.upsert({
        where: { routeKey },
        create: {
            routeKey,
            originAddress: origin,
            destinationAddress: destination,
            stopAddress,
            distanceKm,
            durationMin,
            expiresAt
        },
        update: {
            distanceKm,
            durationMin,
            cachedAt: now,
            expiresAt
        }
    });

    return { distanceKm, durationMin };
}

/**
 * Main calculation function
 */
export async function calculateTransportQuote(
    params: CalculateTransportParams
): Promise<TransportCalculationResult> {
    const { plan, mode, destinationIsThePet, address1, address2, stopAddress, discountPercent = 0 } = params;

    // Validation
    if (plan === 'TL1' && !destinationIsThePet) {
        throw new Error('TL1 plan requires destination to be The Pet');
    }

    if (plan === 'TL2' && !destinationIsThePet && !address2) {
        throw new Error('TL2 plan with external destination requires address2');
    }

    if (discountPercent < 0 || discountPercent > 100) {
        throw new Error('Discount percent must be between 0 and 100');
    }

    // Fetch settings
    const settings: any = await prisma.transportSettings.findFirst();
    if (!settings) {
        throw new Error('Transport settings not configured. Please contact support.');
    }

    const { kmRate, minRate, taxPercent, providerSharePercent } = settings;

    const legs: TransportLegData[] = [];
    let totalLevaBeforeDiscount = 0;
    let totalTrazBeforeDiscount = 0;

    // Determine destinations
    const clientAddress = address1;
    const finalDestination = plan === 'TL1' || destinationIsThePet ? STORE_ADDRESS : address2!;

    // =========== TL1 CALCULATIONS ===========
    if (plan === 'TL1') {
        // Get distance/duration between store and client
        const route = await getRouteWithCache(STORE_ADDRESS, clientAddress);

        if (mode === 'LEVA' || mode === 'LEVA_TRAZ') {
            // PARTIDA: loja -> cliente (KM only)
            const partidaSubtotal = route.distanceKm * kmRate;
            legs.push({
                kind: 'PARTIDA',
                originAddress: STORE_ADDRESS,
                destinationAddress: clientAddress,
                distanceKm: route.distanceKm,
                durationMin: route.durationMin,
                chargeKm: route.distanceKm,
                chargeMin: 0,  // No MIN charge for PARTIDA
                kmRate,
                minRate,
                subtotal: partidaSubtotal
            });

            // LEVA: cliente -> loja (KM + MIN)
            const levaSubtotal = (route.distanceKm * kmRate) + (route.durationMin * minRate);
            legs.push({
                kind: 'LEVA',
                originAddress: clientAddress,
                destinationAddress: STORE_ADDRESS,
                distanceKm: route.distanceKm,
                durationMin: route.durationMin,
                chargeKm: route.distanceKm,
                chargeMin: route.durationMin,
                kmRate,
                minRate,
                subtotal: levaSubtotal
            });

            totalLevaBeforeDiscount = partidaSubtotal + levaSubtotal;

            // TODO: Handle stopAddress for LEVA2
        }

        if (mode === 'TRAZ' || mode === 'LEVA_TRAZ') {
            // TRAZ: loja -> cliente (KM + MIN)
            const trazSubtotal = (route.distanceKm * kmRate) + (route.durationMin * minRate);
            legs.push({
                kind: 'TRAZ',
                originAddress: STORE_ADDRESS,
                destinationAddress: clientAddress,
                distanceKm: route.distanceKm,
                durationMin: route.durationMin,
                chargeKm: route.distanceKm,
                chargeMin: route.durationMin,
                kmRate,
                minRate,
                subtotal: trazSubtotal
            });

            // RETORNO: cliente -> loja (KM only)
            const retornoSubtotal = route.distanceKm * kmRate;
            legs.push({
                kind: 'RETORNO',
                originAddress: clientAddress,
                destinationAddress: STORE_ADDRESS,
                distanceKm: route.distanceKm,
                durationMin: route.durationMin,
                chargeKm: route.distanceKm,
                chargeMin: 0,  // No MIN charge for RETORNO
                kmRate,
                minRate,
                subtotal: retornoSubtotal
            });

            totalTrazBeforeDiscount = trazSubtotal + retornoSubtotal;
        }
    }

    // =========== TL2 CALCULATIONS ===========
    if (plan === 'TL2') {
        const originAddr = clientAddress;
        const destAddr = finalDestination;

        // Get routes
        const route1 = await getRouteWithCache(STORE_ADDRESS, originAddr);  // Store to client
        const route2 = await getRouteWithCache(originAddr, destAddr);       // Client to destination

        if (mode === 'LEVA' || mode === 'LEVA_TRAZ') {
            // PARTIDA: loja -> cliente (KM only)
            const partidaSubtotal = route1.distanceKm * kmRate;
            legs.push({
                kind: 'PARTIDA',
                originAddress: STORE_ADDRESS,
                destinationAddress: originAddr,
                distanceKm: route1.distanceKm,
                durationMin: route1.durationMin,
                chargeKm: route1.distanceKm,
                chargeMin: 0,
                kmRate,
                minRate,
                subtotal: partidaSubtotal
            });

            // LEVA: cliente -> destino (KM + MIN)
            const levaSubtotal = (route2.distanceKm * kmRate) + (route2.durationMin * minRate);
            legs.push({
                kind: 'LEVA',
                originAddress: originAddr,
                destinationAddress: destAddr,
                distanceKm: route2.distanceKm,
                durationMin: route2.durationMin,
                chargeKm: route2.distanceKm,
                chargeMin: route2.durationMin,
                kmRate,
                minRate,
                subtotal: levaSubtotal
            });

            // RETORNO: destino -> loja (KM only)
            const route3 = await getRouteWithCache(destAddr, STORE_ADDRESS);
            const retornoSubtotal = route3.distanceKm * kmRate;
            legs.push({
                kind: 'RETORNO',
                originAddress: destAddr,
                destinationAddress: STORE_ADDRESS,
                distanceKm: route3.distanceKm,
                durationMin: route3.durationMin,
                chargeKm: route3.distanceKm,
                chargeMin: 0,
                kmRate,
                minRate,
                subtotal: retornoSubtotal
            });

            totalLevaBeforeDiscount = partidaSubtotal + levaSubtotal + retornoSubtotal;
        }

        if (mode === 'TRAZ' || mode === 'LEVA_TRAZ') {
            // For TRAZ in TL2: similar logic but reversed
            // PARTIDA: loja -> origem
            const route1Traz = await getRouteWithCache(STORE_ADDRESS, originAddr);
            const partidaTrazSubtotal = route1Traz.distanceKm * kmRate;
            legs.push({
                kind: 'PARTIDA',
                originAddress: STORE_ADDRESS,
                destinationAddress: originAddr,
                distanceKm: route1Traz.distanceKm,
                durationMin: route1Traz.durationMin,
                chargeKm: route1Traz.distanceKm,
                chargeMin: 0,
                kmRate,
                minRate,
                subtotal: partidaTrazSubtotal
            });

            // TRAZ: origem -> cliente (KM + MIN)
            const route2Traz = await getRouteWithCache(originAddr, destAddr);
            const trazSubtotal = (route2Traz.distanceKm * kmRate) + (route2Traz.durationMin * minRate);
            legs.push({
                kind: 'TRAZ',
                originAddress: originAddr,
                destinationAddress: destAddr,
                distanceKm: route2Traz.distanceKm,
                durationMin: route2Traz.durationMin,
                chargeKm: route2Traz.distanceKm,
                chargeMin: route2Traz.durationMin,
                kmRate,
                minRate,
                subtotal: trazSubtotal
            });

            // RETORNO: cliente -> loja (KM only)
            const route3Traz = await getRouteWithCache(destAddr, STORE_ADDRESS);
            const retornoTrazSubtotal = route3Traz.distanceKm * kmRate;
            legs.push({
                kind: 'RETORNO',
                originAddress: destAddr,
                destinationAddress: STORE_ADDRESS,
                distanceKm: route3Traz.distanceKm,
                durationMin: route3Traz.durationMin,
                chargeKm: route3Traz.distanceKm,
                chargeMin: 0,
                kmRate,
                minRate,
                subtotal: retornoTrazSubtotal
            });

            totalTrazBeforeDiscount = partidaTrazSubtotal + trazSubtotal + retornoTrazSubtotal;
        }
    }

    // Calculate totals
    const totalBeforeDiscount = legs.reduce((sum, leg) => sum + leg.subtotal, 0);
    const discountAmount = totalBeforeDiscount * (discountPercent / 100);
    const totalAfterDiscount = totalBeforeDiscount - discountAmount;

    // Calculate separate LEVA/TRAZ totals with discount
    const totalLevaAfterDiscount = totalLevaBeforeDiscount > 0
        ? totalLevaBeforeDiscount - (totalLevaBeforeDiscount * (discountPercent / 100))
        : undefined;

    const totalTrazAfterDiscount = totalTrazBeforeDiscount > 0
        ? totalTrazBeforeDiscount - (totalTrazBeforeDiscount * (discountPercent / 100))
        : undefined;

    return {
        ok: true,
        legs,
        totals: {
            totalBeforeDiscount,
            totalAfterDiscount,
            discountApplied: discountAmount,
            totalLevaBeforeDiscount: totalLevaBeforeDiscount > 0 ? totalLevaBeforeDiscount : undefined,
            totalLevaAfterDiscount,
            totalTrazBeforeDiscount: totalTrazBeforeDiscount > 0 ? totalTrazBeforeDiscount : undefined,
            totalTrazAfterDiscount
        },
        settings: {
            kmRate,
            minRate,
            taxPercent,
            providerSharePercent
        }
    };
}
