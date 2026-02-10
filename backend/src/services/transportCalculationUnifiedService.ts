import prisma from '../lib/prisma';
import { mapsService, MapsError } from './googleMapsService';
import crypto from 'crypto';

/**
 * Transport Calculation Service - UNIFIED
 * Sistema unificado que substitui googleMapsService e transportCalculationService
 * Corrige inconsistências e padroniza cálculos
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
    petQuantity?: number;
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
    handlingTime: number;      // Tempo de handling adicionado
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
 * Gerar chave de cache para rota
 */
function generateRouteKey(origin: string, dest: string, stop?: string, plan?: string): string {
    const data = `${origin}|${dest}|${stop || ''}|${plan || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Obter rota com cache ou buscar do Google Maps
 */
async function getRouteWithCache(
    origin: string,
    destination: string,
    stopAddress?: string
): Promise<{ distanceKm: number; durationMin: number; handlingTime?: number }> {
    const routeKey = generateRouteKey(origin, destination, stopAddress);

    // Verificar cache primeiro
    const cached = await (prisma as any).routeCache.findUnique({
        where: { routeKey }
    });

    const now = new Date();
    if (cached && cached.expiresAt > now) {
        console.log(`[TransportUnified] Using cached route: ${routeKey.substring(0, 12)}...`);
        return {
            distanceKm: cached.distanceKm,
            durationMin: cached.durationMin,
            handlingTime: (cached as any).handlingTime || 0
        };
    }

    // Cache miss - buscar do Google Maps
    console.log(`[TransportUnified] Fetching from Google Maps: ${origin} -> ${destination}`);

    const result = await mapsService.calculateTransportDetailed(origin, destination, 'ROUND_TRIP');

    // Extrair dados do primeiro leg
    const firstLeg = result.breakdown.largada;
    if (!firstLeg) {
        throw new Error('Failed to get route data from Google Maps');
    }

    const distanceKm = firstLeg.distanceKm;
    const durationMin = firstLeg.durationMin;
    const handlingTime = (firstLeg as any).handlingTime || 0; // Tempo de handling separado

    // Salvar no cache
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
            handlingTime,
            expiresAt
        },
        update: {
            distanceKm,
            durationMin,
            handlingTime,
            cachedAt: now,
            expiresAt
        }
    });

    return { distanceKm, durationMin, handlingTime };
}

/**
 * Função principal de cálculo unificado
 */
export async function calculateTransportQuoteUnified(
    params: CalculateTransportParams
): Promise<TransportCalculationResult> {
    const {
        plan,
        mode,
        destinationIsThePet,
        address1,
        address2,
        stopAddress,
        discountPercent = 0,
        petQuantity
    } = params;

    // Validações
    if (plan === 'TL1' && !destinationIsThePet) {
        throw new Error('TL1 plan requires destination to be The Pet');
    }

    if (plan === 'TL2' && !destinationIsThePet && !address2) {
        throw new Error('TL2 plan with external destination requires address2');
    }

    if (discountPercent < 0 || discountPercent > 100) {
        throw new Error('Discount percent must be between 0 and 100');
    }

    // Buscar configurações
    const settings: any = await prisma.transportSettings.findFirst();
    if (!settings) {
        throw new Error('Transport settings not configured. Please contact support.');
    }

    const {
        kmPriceLargada, kmPriceLeva, kmPriceTraz, kmPriceRetorno,
        minPriceLargada, minPriceLeva, minPriceTraz, minPriceRetorno,
        taxPercent, providerSharePercent, additionalPetSurchargePercent, kmRate, minRate
    } = settings;

    const legs: TransportLegData[] = [];
    let totalLevaBeforeDiscount = 0;
    let totalTrazBeforeDiscount = 0;

    // Determinar destinos
    const clientAddress = address1;
    const finalDestination = plan === 'TL1' || destinationIsThePet ? STORE_ADDRESS : address2!;

    // ========== CÁLCULOS TL1 ==========
    if (plan === 'TL1') {
        const route = await getRouteWithCache(STORE_ADDRESS, clientAddress);

        if (mode === 'LEVA' || mode === 'LEVA_TRAZ') {
            // PARTIDA: loja -> cliente (KM apenas)
            const partidaSubtotal = route.distanceKm * kmPriceLargada;
            legs.push({
                kind: 'PARTIDA',
                originAddress: STORE_ADDRESS,
                destinationAddress: clientAddress,
                distanceKm: route.distanceKm,
                durationMin: route.durationMin,
                chargeKm: route.distanceKm,
                chargeMin: 0,
                kmRate: kmPriceLargada,
                minRate: minPriceLargada,
                subtotal: partidaSubtotal,
                handlingTime: 0
            });

            // LEVA: cliente -> loja (KM + MIN)
            const levaSubtotal = (route.distanceKm * kmPriceLeva) + ((route.durationMin + (route.handlingTime || 0)) * minPriceLeva);
            legs.push({
                kind: 'LEVA',
                originAddress: clientAddress,
                destinationAddress: STORE_ADDRESS,
                distanceKm: route.distanceKm,
                durationMin: route.durationMin,
                chargeKm: route.distanceKm,
                chargeMin: route.durationMin + (route as any).handlingTime || 0,
                kmRate: kmPriceLeva,
                minRate: minPriceLeva,
                subtotal: levaSubtotal,
                handlingTime: (route as any).handlingTime || 0
            });

            totalLevaBeforeDiscount = partidaSubtotal + levaSubtotal;
        }

        if (mode === 'TRAZ' || mode === 'LEVA_TRAZ') {
            // TRAZ: loja -> cliente (KM + MIN)
            const trazSubtotal = (route.distanceKm * kmPriceTraz) + ((route.durationMin + (route as any).handlingTime || 0) * minPriceTraz);
            legs.push({
                kind: 'TRAZ',
                originAddress: STORE_ADDRESS,
                destinationAddress: clientAddress,
                distanceKm: route.distanceKm,
                durationMin: route.durationMin,
                chargeKm: route.distanceKm,
                chargeMin: route.durationMin + (route as any).handlingTime || 0,
                kmRate: kmPriceTraz,
                minRate: minPriceTraz,
                subtotal: trazSubtotal,
                handlingTime: (route as any).handlingTime || 0
            });

            // RETORNO: cliente -> loja (KM apenas)
            const retornoSubtotal = route.distanceKm * kmPriceRetorno;
            legs.push({
                kind: 'RETORNO',
                originAddress: clientAddress,
                destinationAddress: STORE_ADDRESS,
                distanceKm: route.distanceKm,
                durationMin: route.durationMin,
                chargeKm: route.distanceKm,
                chargeMin: 0,
                kmRate: kmPriceRetorno,
                minRate: minPriceRetorno,
                subtotal: retornoSubtotal,
                handlingTime: 0
            });

            totalTrazBeforeDiscount = trazSubtotal + retornoSubtotal;
        }
    }

    // ========== CÁLCULOS TL2 ==========
    if (plan === 'TL2') {
        const originAddr = clientAddress;
        const destAddr = finalDestination;

        // Buscar rotas (com cache para evitar duplicatas)
        const route1 = await getRouteWithCache(STORE_ADDRESS, originAddr);  // Store to client
        const route2 = await getRouteWithCache(originAddr, destAddr);       // Client to destination

        if (mode === 'LEVA' || mode === 'LEVA_TRAZ') {
            // PARTIDA: loja -> cliente (KM apenas)
            const partidaSubtotal = route1.distanceKm * kmPriceLargada;
            legs.push({
                kind: 'PARTIDA',
                originAddress: STORE_ADDRESS,
                destinationAddress: originAddr,
                distanceKm: route1.distanceKm,
                durationMin: route1.durationMin,
                chargeKm: route1.distanceKm,
                chargeMin: 0,
                kmRate: kmPriceLargada,
                minRate: minPriceLargada,
                subtotal: partidaSubtotal,
                handlingTime: 0
            });

            // LEVA: cliente -> destino (KM + MIN)
            const levaSubtotal = (route2.distanceKm * kmPriceLeva) + ((route2.durationMin + (route2 as any).handlingTime || 0) * minPriceLeva);
            legs.push({
                kind: 'LEVA',
                originAddress: originAddr,
                destinationAddress: destAddr,
                distanceKm: route2.distanceKm,
                durationMin: route2.durationMin,
                chargeKm: route2.distanceKm,
                chargeMin: route2.durationMin + (route2 as any).handlingTime || 0,
                kmRate: kmPriceLeva,
                minRate: minPriceLeva,
                subtotal: levaSubtotal,
                handlingTime: (route2 as any).handlingTime || 0
            });

            // RETORNO: destino -> loja (KM apenas)
            const route3 = await getRouteWithCache(destAddr, STORE_ADDRESS);
            const retornoSubtotal = route3.distanceKm * kmPriceRetorno;
            legs.push({
                kind: 'RETORNO',
                originAddress: destAddr,
                destinationAddress: STORE_ADDRESS,
                distanceKm: route3.distanceKm,
                durationMin: route3.durationMin,
                chargeKm: route3.distanceKm,
                chargeMin: 0,
                kmRate: kmPriceRetorno,
                minRate: minPriceRetorno,
                subtotal: retornoSubtotal,
                handlingTime: 0
            });

            totalLevaBeforeDiscount = partidaSubtotal + levaSubtotal + retornoSubtotal;
        }

        if (mode === 'TRAZ' || mode === 'LEVA_TRAZ') {
            // TRAZ em TL2: lógica similar mas invertida
            const route1Traz = await getRouteWithCache(STORE_ADDRESS, originAddr);
            const partidaTrazSubtotal = route1Traz.distanceKm * kmPriceLargada;
            legs.push({
                kind: 'PARTIDA',
                originAddress: STORE_ADDRESS,
                destinationAddress: originAddr,
                distanceKm: route1Traz.distanceKm,
                durationMin: route1Traz.durationMin,
                chargeKm: route1Traz.distanceKm,
                chargeMin: 0,
                kmRate: kmPriceLargada,
                minRate: minPriceLargada,
                subtotal: partidaTrazSubtotal,
                handlingTime: 0
            });

            const route2Traz = await getRouteWithCache(originAddr, destAddr);
            const trazSubtotal = (route2Traz.distanceKm * kmPriceTraz) + ((route2Traz.durationMin + (route2Traz as any).handlingTime || 0) * minPriceTraz);
            legs.push({
                kind: 'TRAZ',
                originAddress: originAddr,
                destinationAddress: destAddr,
                distanceKm: route2Traz.distanceKm,
                durationMin: route2Traz.durationMin,
                chargeKm: route2Traz.distanceKm,
                chargeMin: route2Traz.durationMin + (route2Traz as any).handlingTime || 0,
                kmRate: kmPriceTraz,
                minRate: minPriceTraz,
                subtotal: trazSubtotal,
                handlingTime: (route2Traz as any).handlingTime || 0
            });

            const route3Traz = await getRouteWithCache(destAddr, STORE_ADDRESS);
            const retornoTrazSubtotal = route3Traz.distanceKm * kmPriceRetorno;
            legs.push({
                kind: 'RETORNO',
                originAddress: destAddr,
                destinationAddress: STORE_ADDRESS,
                distanceKm: route3Traz.distanceKm,
                durationMin: route3Traz.durationMin,
                chargeKm: route3Traz.distanceKm,
                chargeMin: 0,
                kmRate: kmPriceRetorno,
                minRate: minPriceRetorno,
                subtotal: retornoTrazSubtotal,
                handlingTime: 0
            });

            totalTrazBeforeDiscount = partidaTrazSubtotal + trazSubtotal + retornoTrazSubtotal;
        }
    }

    // Calcular totais
    const totalBeforeSurcharge = legs.reduce((sum, leg) => sum + leg.subtotal, 0);

    // Aplicar taxa de pets adicionais (se houver mais de 1 pet)
    const extraPets = Math.max(0, (petQuantity || 1) - 1);
    const surchargePercent = extraPets * (additionalPetSurchargePercent || 0);
    const surchargeAmount = totalBeforeSurcharge * (surchargePercent / 100);

    const totalBeforeDiscount = totalBeforeSurcharge + surchargeAmount;
    const discountAmount = totalBeforeDiscount * (discountPercent / 100);
    const totalAfterDiscount = totalBeforeDiscount - discountAmount;

    // Fator de acréscimo (1.0 = sem pets extras, 1.2 = 20% extra etc)
    const surchargeFactor = 1 + (surchargePercent / 100);

    // Calcular totais separados LEVA/TRAZ com desconto e surcharge
    const totalLevaAfterDiscount = totalLevaBeforeDiscount > 0
        ? (totalLevaBeforeDiscount * surchargeFactor) - ((totalLevaBeforeDiscount * surchargeFactor) * (discountPercent / 100))
        : undefined;

    const totalTrazAfterDiscount = totalTrazBeforeDiscount > 0
        ? (totalTrazBeforeDiscount * surchargeFactor) - ((totalTrazBeforeDiscount * surchargeFactor) * (discountPercent / 100))
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

/**
 * Verificar se endereços são diferentes (validação TL2)
 */
export function validateDistinctAddresses(address1: string, address2: string): boolean {
    return address1.trim().toLowerCase() !== address2.trim().toLowerCase();
}
