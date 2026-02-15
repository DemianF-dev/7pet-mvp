import { TransportType } from '@prisma/client';
import prisma from '../lib/prisma';

export interface TransportLeg {
    type: 'LARGADA' | 'LEVA' | 'TRAZ' | 'RETORNO';
    origin: string;
    destination: string;
    distance?: number; // km
    duration?: number; // min
    price?: number;
    driverId?: string;
    order?: number;
}

export interface TransportCalculationRequest {
    origin: string;
    destination?: string;
    type: TransportType;
    stops?: string[]; // Intermediate addresses
}

export interface TransportCalculationResult {
    total: number;
    totalDistance: string;
    totalDuration: string;
    breakdown: Record<string, any>;
    settings: any;
}

/**
 * Mocks or calls Google Maps API to get distance/duration
 */
const getDistanceDuration = async (origin: string, destination: string): Promise<{ distance: number, duration: number }> => {
    // TODO: Integrate Google Maps API here. 
    // For now, returning mock data or random values for demo/MVP if API key not available.
    // In a real scenario, use @googlemaps/google-maps-services-js

    // Pseudo-random but deterministic based on string length to simulate variety
    const baseDist = Math.max(2, (origin.length + destination.length) / 10);
    const baseDur = baseDist * 2.5; // roughly 2.5 min per km

    return {
        distance: parseFloat(baseDist.toFixed(1)),
        duration: Math.round(baseDur)
    };
};

export const calculateTransport = async (data: TransportCalculationRequest): Promise<TransportCalculationResult> => {
    const settings = await prisma.transportSettings.findFirst() || {
        kmPriceLargada: 2.0,
        kmPriceLeva: 2.0,
        kmPriceTraz: 2.0,
        kmPriceRetorno: 2.0,
        minPriceLargada: 1.5,
        minPriceLeva: 1.5,
        minPriceTraz: 1.5,
        minPriceRetorno: 1.5,
        handlingTimeLeva: 5,
        handlingTimeTraz: 5
    };

    const breakdown: any = {};
    let total = 0;
    let totalKm = 0;
    let totalMin = 0;

    // Default Base Address (7Pet)
    // Atualizado conforme solicitação do usuário
    const baseAddress = "Av. Hildebrando de Lima, 525, Km 18, Osasco - SP";

    // Helper to calculate price for a leg
    const calcLegPrice = (dist: number, dur: number, legType: 'Largada' | 'Leva' | 'Traz' | 'Retorno') => {
        const typeKey = legType as keyof typeof settings; // e.g. kmPriceLeva
        const kmPrice = (settings as any)[`kmPrice${legType}`] || 0;
        const minPrice = (settings as any)[`minPrice${legType}`] || 0;
        const handling = (legType === 'Leva' ? settings.handlingTimeLeva : (legType === 'Traz' ? settings.handlingTimeTraz : 0));

        return (dist * kmPrice) + ((dur + handling) * minPrice);
    };

    // Normalize destination
    const normalizedDest = (!data.destination || data.destination === '7Pet') ? baseAddress : data.destination;
    // Normalize origin for DROP_OFF case if needed (usually origin is passed correctly)
    const normalizedOrigin = (!data.origin || data.origin === '7Pet') ? baseAddress : data.origin;

    if (data.type === 'PICK_UP') {
        const dest = normalizedDest;

        // 1. Largada (Base -> Origin)
        const largada = await getDistanceDuration(baseAddress, data.origin);
        const largadaPrice = calcLegPrice(largada.distance, largada.duration, 'Largada');

        breakdown.largada = {
            originAddress: baseAddress,
            destinationAddress: data.origin,
            distance: largada.distance + ' km',
            distanceKm: largada.distance,
            duration: largada.duration + ' min',
            durationMin: largada.duration,
            price: largadaPrice.toFixed(2)
        };
        total += largadaPrice;
        totalKm += largada.distance;
        totalMin += largada.duration;

        // 2. Leva (Origin -> Dest)
        const leva = await getDistanceDuration(data.origin, dest);
        const levaPrice = calcLegPrice(leva.distance, leva.duration, 'Leva');

        breakdown.leva = {
            originAddress: data.origin,
            destinationAddress: dest,
            distance: leva.distance + ' km',
            distanceKm: leva.distance,
            duration: leva.duration + ' min',
            durationMin: leva.duration,
            price: levaPrice.toFixed(2)
        };
        total += levaPrice;
        totalKm += leva.distance;
        totalMin += leva.duration;

        // 3. Retorno (Dest -> Base) - Se o destino não for a base
        if (dest !== baseAddress) {
            const retorno = await getDistanceDuration(dest, baseAddress);
            const retornoPrice = calcLegPrice(retorno.distance, retorno.duration, 'Retorno');

            breakdown.retorno = {
                originAddress: dest,
                destinationAddress: baseAddress,
                distance: retorno.distance + ' km',
                distanceKm: retorno.distance,
                duration: retorno.duration + ' min',
                durationMin: retorno.duration,
                price: retornoPrice.toFixed(2)
            };
            total += retornoPrice;
            totalKm += retorno.distance;
            totalMin += retorno.duration;
        }
    }

    if (data.type === 'DROP_OFF') {
        const origin = normalizedDest; // "Onde o pet está" (7Pet ou Clinic)
        const dest = normalizedOrigin; // Casa do cliente

        // 1. Largada (Base -> Origin/Onde pet está)
        if (origin !== baseAddress) {
            const largada = await getDistanceDuration(baseAddress, origin);
            const largadaPrice = calcLegPrice(largada.distance, largada.duration, 'Largada');

            breakdown.largada = {
                originAddress: baseAddress,
                destinationAddress: origin,
                distance: largada.distance + ' km',
                distanceKm: largada.distance,
                duration: largada.duration + ' min',
                durationMin: largada.duration,
                price: largadaPrice.toFixed(2)
            };
            total += largadaPrice;
            totalKm += largada.distance;
            totalMin += largada.duration;
        }

        // 2. Traz (Origin -> Dest)
        const traz = await getDistanceDuration(origin, dest);
        const trazPrice = calcLegPrice(traz.distance, traz.duration, 'Traz');

        breakdown.traz = {
            originAddress: origin,
            destinationAddress: dest,
            distance: traz.distance + ' km',
            distanceKm: traz.distance,
            duration: traz.duration + ' min',
            durationMin: traz.duration,
            price: trazPrice.toFixed(2)
        };
        total += trazPrice;
        totalKm += traz.distance;
        totalMin += traz.duration;

        // 3. Retorno (Dest -> Base)
        const retorno = await getDistanceDuration(dest, baseAddress);
        const retornoPrice = calcLegPrice(retorno.distance, retorno.duration, 'Retorno');

        breakdown.retorno = {
            originAddress: dest,
            destinationAddress: baseAddress,
            distance: retorno.distance + ' km',
            distanceKm: retorno.distance,
            duration: retorno.duration + ' min',
            durationMin: retorno.duration,
            price: retornoPrice.toFixed(2)
        };
        total += retornoPrice;
        totalKm += retorno.distance;
        totalMin += retorno.duration;
    }

    if (data.type === 'ROUND_TRIP') {
        const dest = normalizedDest;
        const origin = normalizedOrigin;

        // 1. Largada (Base -> Origin)
        const largada = await getDistanceDuration(baseAddress, origin);
        const largadaPrice = calcLegPrice(largada.distance, largada.duration, 'Largada');

        breakdown.largada = {
            originAddress: baseAddress,
            destinationAddress: origin,
            distance: largada.distance + ' km',
            distanceKm: largada.distance,
            duration: largada.duration + ' min',
            durationMin: largada.duration,
            price: largadaPrice.toFixed(2)
        };
        total += largadaPrice;
        totalKm += largada.distance;
        totalMin += largada.duration;

        // 2. Leva (Origin -> Destination/Base)
        const leva = await getDistanceDuration(origin, dest);
        const levaPrice = calcLegPrice(leva.distance, leva.duration, 'Leva');

        breakdown.leva = {
            originAddress: origin,
            destinationAddress: dest,
            distance: leva.distance + ' km',
            distanceKm: leva.distance,
            duration: leva.duration + ' min',
            durationMin: leva.duration,
            price: levaPrice.toFixed(2)
        };
        total += levaPrice;
        totalKm += leva.distance;
        totalMin += leva.duration;

        // 3. Traz (Destination -> Origin)
        const traz = await getDistanceDuration(dest, origin);
        const trazPrice = calcLegPrice(traz.distance, traz.duration, 'Traz');

        breakdown.traz = {
            originAddress: dest,
            destinationAddress: origin,
            distance: traz.distance + ' km',
            distanceKm: traz.distance,
            duration: traz.duration + ' min',
            durationMin: traz.duration,
            price: trazPrice.toFixed(2)
        };
        total += trazPrice;
        totalKm += traz.distance;
        totalMin += traz.duration;

        // 4. Retorno (Origin -> Base)
        const retorno = await getDistanceDuration(origin, baseAddress);
        const retornoPrice = calcLegPrice(retorno.distance, retorno.duration, 'Retorno');

        breakdown.retorno = {
            originAddress: origin,
            destinationAddress: baseAddress,
            distance: retorno.distance + ' km',
            distanceKm: retorno.distance,
            duration: retorno.duration + ' min',
            durationMin: retorno.duration,
            price: retornoPrice.toFixed(2)
        };
        total += retornoPrice;
        totalKm += retorno.distance;
        totalMin += retorno.duration;
    }

    return {
        total,
        totalDistance: totalKm.toFixed(1) + ' km',
        totalDuration: totalMin.toFixed(0) + ' min',
        breakdown,
        settings
    };
};
