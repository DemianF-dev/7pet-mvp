import { Client, TravelMode, TrafficModel } from "@googlemaps/google-maps-services-js";
// Trigger reload for env var update
import dotenv from 'dotenv';
import prisma from '../lib/prisma';

dotenv.config();

const client = new Client({});

interface LegCalculation {
    distance: string;
    duration: string;
    distanceKm: number;
    durationMin: number;
    price: number;
}

interface DetailedTransportResult {
    breakdown: {
        largada?: LegCalculation;
        leva?: LegCalculation;
        traz?: LegCalculation;
        retorno?: LegCalculation;
    };
    total: number;
    totalDistance: string;
    totalDuration: string;
    settings: any;
}

interface TransportCalculationResult {
    distanceText: string;
    durationText: string;
    distanceValue: number; // meters
    durationValue: number; // seconds
    estimatedPrice?: number;
    legs: {
        distance: string;
        duration: string;
    };
}

export const mapsService = {
    /**
     * Detailed transport calculation with breakdown by leg
     */
    async calculateTransportDetailed(
        originAddress: string,
        destinationAddress?: string,
        type: 'ROUND_TRIP' | 'PICK_UP' | 'DROP_OFF' = 'ROUND_TRIP'
    ): Promise<DetailedTransportResult> {
        const storeAddress = process.env.STORE_ADDRESS || "Av. Hildebrando de Lima, 525, Osasco - SP";

        if (!process.env.GOOGLE_MAPS_API_KEY) {
            console.error("GOOGLE_MAPS_API_KEY is missing!");
            throw new Error("Configuration error: Maps API Key missing");
        }

        try {
            // Need to calculate for origin (START/LEVA) and destination (TRAZ/RETURN)
            // If destination is same as origin or not provided, we reuse origin calculation

            const destAddr = destinationAddress && destinationAddress.trim() !== '' ? destinationAddress : originAddress;
            const distinctAddresses = destAddr !== originAddress;

            // Fetch settings first
            const settings = await prisma.transportSettings.findFirst();
            if (!settings) {
                throw new Error("Transport settings not found. Please configure them first.");
            }

            const {
                kmPriceLargada, kmPriceLeva, kmPriceTraz, kmPriceRetorno,
                minPriceLargada, minPriceLeva, minPriceTraz, minPriceRetorno,
                handlingTimeLargada, handlingTimeLeva, handlingTimeTraz, handlingTimeRetorno
            } = settings;

            // 1. Calculate OD for Origin (Store <-> Origin)
            // We assume symmetric travel for simplification (Store->Origin = Origin->Store)
            const originResponse = await client.distancematrix({
                params: {
                    origins: [storeAddress],
                    destinations: [originAddress],
                    key: process.env.GOOGLE_MAPS_API_KEY,
                    language: 'pt-BR',
                    mode: TravelMode.driving,
                    departure_time: 'now' as any,
                    traffic_model: TrafficModel.pessimistic
                }
            });

            if (originResponse.data.status !== "OK") throw new Error(`Maps API Error (Origin): ${originResponse.data.status}`);
            const originElement = originResponse.data.rows[0].elements[0];
            if (originElement.status !== "OK") throw new Error(`Route not found for origin: ${originElement.status}`);

            const originKm = originElement.distance.value / 1000;
            const originMin = Math.ceil(originElement.duration.value / 60);

            // 2. Calculate OD for Destination (if different)
            let destKm = originKm;
            let destMin = originMin;
            let destDistanceText = originElement.distance.text;
            let destDurationText = originElement.duration.text;

            if (distinctAddresses) {
                const destResponse = await client.distancematrix({
                    params: {
                        origins: [storeAddress],
                        destinations: [destAddr],
                        key: process.env.GOOGLE_MAPS_API_KEY,
                        language: 'pt-BR',
                        mode: TravelMode.driving,
                        departure_time: 'now' as any,
                        traffic_model: TrafficModel.pessimistic
                    }
                });

                if (destResponse.data.status !== "OK") throw new Error(`Maps API Error (Dest): ${destResponse.data.status}`);
                const destElement = destResponse.data.rows[0].elements[0];
                if (destElement.status !== "OK") throw new Error(`Route not found for destination: ${destElement.status}`);

                destKm = destElement.distance.value / 1000;
                destMin = Math.ceil(destElement.duration.value / 60);
                destDistanceText = destElement.distance.text;
                destDurationText = destElement.duration.text;
            }

            // Build Legs based on Type
            const breakdown: DetailedTransportResult['breakdown'] = {};
            let total = 0;
            let totalKm = 0;
            let totalMin = 0;

            // Determines which legs are active
            const doStart = type === 'ROUND_TRIP' || type === 'PICK_UP';
            const doReturn = type === 'ROUND_TRIP' || type === 'DROP_OFF';

            if (doStart) {
                // Leg 1: Largada (Store -> Origin)
                const leg1Price = (originKm * kmPriceLargada) + ((originMin + handlingTimeLargada) * minPriceLargada);
                breakdown.largada = {
                    distance: originElement.distance.text,
                    duration: originElement.duration.text,
                    distanceKm: originKm,
                    durationMin: originMin + handlingTimeLargada,
                    price: leg1Price
                };
                total += leg1Price;
                totalKm += originKm;
                totalMin += originMin + handlingTimeLargada;

                // Leg 2: Leva (Origin -> Store)
                const leg2Price = (originKm * kmPriceLeva) + ((originMin + handlingTimeLeva) * minPriceLeva);
                breakdown.leva = {
                    distance: originElement.distance.text,
                    duration: originElement.duration.text,
                    distanceKm: originKm,
                    durationMin: originMin + handlingTimeLeva,
                    price: leg2Price
                };
                total += leg2Price;
                totalKm += originKm;
                totalMin += originMin + handlingTimeLeva;
            }

            if (doReturn) {
                // Leg 3: Traz (Store -> Destination)
                const leg3Price = (destKm * kmPriceTraz) + ((destMin + handlingTimeTraz) * minPriceTraz);
                breakdown.traz = {
                    distance: destDistanceText,
                    duration: destDurationText,
                    distanceKm: destKm,
                    durationMin: destMin + handlingTimeTraz,
                    price: leg3Price
                };
                total += leg3Price;
                totalKm += destKm;
                totalMin += destMin + handlingTimeTraz;

                // Leg 4: Retorno (Destination -> Store)
                const leg4Price = (destKm * kmPriceRetorno) + ((destMin + handlingTimeRetorno) * minPriceRetorno);
                breakdown.retorno = {
                    distance: destDistanceText,
                    duration: destDurationText,
                    distanceKm: destKm,
                    durationMin: destMin + handlingTimeRetorno,
                    price: leg4Price
                };
                total += leg4Price;
                totalKm += destKm;
                totalMin += destMin + handlingTimeRetorno;
            }

            return {
                breakdown,
                total,
                totalDistance: `${totalKm.toFixed(1)} km`,
                totalDuration: `${totalMin} min`,
                totalKm,
                totalMin,
                settings
            };

        } catch (error) {
            console.error("Error calculating detailed transport:", error);
            throw error;
        }
    },

    /**
     * Legacy simplified calculation (for backward compatibility)
     */
    async calculateTransport(clientAddress: string): Promise<TransportCalculationResult> {
        try {
            const detailed = await this.calculateTransportDetailed(clientAddress);

            // Legacy assumes Round Trip structure
            const distVal = (detailed.breakdown.largada?.distanceKm || 0) * 1000;
            const durVal = (detailed.breakdown.largada?.durationMin || 0) * 60; // Approx

            return {
                distanceText: detailed.totalDistance,
                durationText: detailed.totalDuration,
                distanceValue: distVal * 4,
                durationValue: durVal * 4,
                estimatedPrice: detailed.total,
                legs: {
                    distance: detailed.breakdown.largada?.distance || '0 km',
                    duration: detailed.breakdown.largada?.duration || '0 min'
                }
            };
        } catch (error) {
            console.error("Error calculating transport:", error);
            throw error;
        }
    }
};
