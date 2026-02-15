import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { MapsError } from '../services/googleMapsService';
import * as transportCalc from '../services/transportCalculationService';
import * as transportUnified from '../services/transportCalculationUnifiedService';
import { logInfo, logError } from '../utils/logger';
import { z } from 'zod';

export const quoteTransportController = {
    /**
     * Calculate transport estimate (simple)
     */
    async calculateTransportEstimate(req: Request, res: Response) {
        try {
            const { type, origin, destination, stops } = req.body;

            if (!origin) return res.status(400).json({ error: 'Origem é obrigatória' });

            const result = await require('../services/transportService').calculateTransport({
                origin,
                destination,
                type: type || 'ROUND_TRIP',
                stops
            });

            return res.json(result);
        } catch (error: any) {
            logError('[QuoteTransport] Erro ao calcular transporte:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    /**
     * Calculate detailed transport costs for a quote
     */
    async calculateTransport(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { address, destinationAddress, type } = req.body;

            if (!address) {
                return res.status(400).json({ error: 'Endereço de origem é obrigatório' });
            }

            const quote = await prisma.quote.findUnique({
                where: { id }
            });

            if (!quote) {
                return res.status(404).json({ error: 'Orçamento não encontrado' });
            }

            logInfo(`[QuoteTransport] Calculating transport for Quote ID: ${id}`);

            const validTypes = ['ROUND_TRIP', 'PICK_UP', 'DROP_OFF'];
            const transportType = (type && validTypes.includes(type)) ? type : 'ROUND_TRIP';

            const result = await transportUnified.calculateTransportQuoteUnified({
                plan: 'TL1',
                mode: transportType === 'PICK_UP' ? 'LEVA' : transportType === 'DROP_OFF' ? 'TRAZ' : 'LEVA_TRAZ',
                destinationIsThePet: true,
                address1: address,
                address2: destinationAddress,
                petQuantity: quote.petQuantity || 1
            });

            // Persist LEGS V2
            await prisma.transportLeg.deleteMany({
                where: { quoteId: id }
            });

            await prisma.transportLeg.createMany({
                data: result.legs.map(leg => ({
                    quoteId: id,
                    legType: leg.kind as any,
                    originAddress: leg.originAddress,
                    destinationAddress: leg.destinationAddress,
                    kms: leg.distanceKm,
                    minutes: Math.round(leg.durationMin),
                    price: leg.subtotal,
                }))
            });

            return res.status(200).json({
                total: result.totals.totalAfterDiscount,
                totalBeforeDiscount: result.totals.totalBeforeDiscount,
                totalDistance: result.legs.reduce((sum: number, leg) => sum + leg.distanceKm, 0).toFixed(2) + ' km',
                totalDuration: result.legs.reduce((sum: number, leg) => sum + leg.durationMin, 0).toFixed(0) + ' min',
                breakdown: {
                    largada: {
                        distance: result.legs.find(l => l.kind === 'PARTIDA')?.distanceKm.toFixed(1) + ' km',
                        duration: result.legs.find(l => l.kind === 'PARTIDA')?.durationMin + ' min',
                        price: result.legs.find(l => l.kind === 'PARTIDA')?.subtotal || 0,
                        originAddress: result.legs.find(l => l.kind === 'PARTIDA')?.originAddress || '',
                        destinationAddress: result.legs.find(l => l.kind === 'PARTIDA')?.destinationAddress || ''
                    },
                    leva: {
                        distance: result.legs.find(l => l.kind === 'LEVA')?.distanceKm.toFixed(1) + ' km',
                        duration: result.legs.find(l => l.kind === 'LEVA')?.durationMin + ' min',
                        price: result.legs.find(l => l.kind === 'LEVA')?.subtotal || 0,
                        originAddress: result.legs.find(l => l.kind === 'LEVA')?.originAddress || '',
                        destinationAddress: result.legs.find(l => l.kind === 'LEVA')?.destinationAddress || ''
                    },
                    traz: {
                        distance: result.legs.find(l => l.kind === 'TRAZ')?.distanceKm.toFixed(1) + ' km',
                        duration: result.legs.find(l => l.kind === 'TRAZ')?.durationMin + ' min',
                        price: result.legs.find(l => l.kind === 'TRAZ')?.subtotal || 0,
                        originAddress: result.legs.find(l => l.kind === 'TRAZ')?.originAddress || '',
                        destinationAddress: result.legs.find(l => l.kind === 'TRAZ')?.destinationAddress || ''
                    },
                    retorno: {
                        distance: result.legs.find(l => l.kind === 'RETORNO')?.distanceKm.toFixed(1) + ' km',
                        duration: result.legs.find(l => l.kind === 'RETORNO')?.durationMin + ' min',
                        price: result.legs.find(l => l.kind === 'RETORNO')?.subtotal || 0,
                        originAddress: result.legs.find(l => l.kind === 'RETORNO')?.originAddress || '',
                        destinationAddress: result.legs.find(l => l.kind === 'RETORNO')?.destinationAddress || ''
                    }
                },
                settings: result.settings
            });
        } catch (error: any) {
            logError('[QuoteTransport] Error calculating transport:', error);

            if (error instanceof MapsError) {
                logError(`[QuoteTransport] MapsError for Quote ${req.params.id}: code=${error.code}, status=${error.upstreamStatus}, origin=${req.body.address}, dest=${req.body.destinationAddress || 'N/A'}`, error);

                const statusCode = error.code === 'MAPS_AUTH' ? 502 :
                    error.code === 'MAPS_QUOTA' ? 503 :
                        error.code === 'MAPS_BAD_REQUEST' ? 400 :
                            error.code === 'MAPS_CONFIG' ? 500 :
                                502;

                const userMessages: Record<string, string> = {
                    'MAPS_AUTH': 'Erro ao calcular rota. Entre em contato com o suporte.',
                    'MAPS_QUOTA': 'Limite de uso atingido. Tente novamente em alguns minutos.',
                    'MAPS_BAD_REQUEST': 'Endereco invalido. Verifique o endereco e tente novamente.',
                    'MAPS_UPSTREAM': 'Servico de mapas temporariamente indisponivel.',
                    'MAPS_CONFIG': 'Erro de configuracao. Entre em contato com o suporte.'
                };

                return res.status(statusCode).json({
                    ok: false,
                    code: error.code,
                    messageUser: userMessages[error.code] || 'Erro ao calcular transporte.',
                    messageDev: `${error.message}${error.upstreamMessage ? ` | Upstream: ${error.upstreamMessage}` : ''}`,
                    upstreamStatus: error.upstreamStatus
                });
            }

            logError('[QuoteTransport] Unexpected error:', error);
            return res.status(500).json({
                ok: false,
                code: 'INTERNAL_ERROR',
                messageUser: 'Erro inesperado. Tente novamente ou entre em contato com o suporte.',
                messageDev: error.message || 'Unknown error'
            });
        }
    },

    /**
     * Calculate transport pricing with detailed breakdown
     * POST /transport/calculate
     */
    async calculateTransportDetailed(req: Request, res: Response) {
        try {
            const schema = z.object({
                plan: z.enum(['TL1', 'TL2']),
                mode: z.enum(['LEVA', 'TRAZ', 'LEVA_TRAZ']),
                destinationIsThePet: z.boolean(),
                address1: z.string().min(5, 'Endereço do cliente é obrigatório'),
                address2: z.string().optional(),
                stopAddress: z.string().optional(),
                discountPercent: z.number().min(0).max(100).optional().default(0)
            });

            const data = schema.parse(req.body);

            if (data.plan === 'TL2' && !data.destinationIsThePet && !data.address2) {
                return res.status(422).json({
                    error: 'address2 é obrigatório para TL2 quando o destino não é The Pet'
                });
            }

            const result = await transportCalc.calculateTransportQuote(data);

            logInfo('[TransportCalc] Success:', result.totals);
            return res.json(result);

        } catch (error: any) {
            logError('[TransportCalc] Error:', error);

            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Validação falhou',
                    details: error.issues
                });
            }

            if (error instanceof Error) {
                if (error.message.includes('requires') || error.message.includes('obrigatório')) {
                    return res.status(422).json({ error: error.message });
                }

                if (error.message.includes('Google Maps') || error.message.includes('route')) {
                    return res.status(503).json({
                        error: 'Erro ao calcular rota',
                        message: error.message
                    });
                }
            }

            return res.status(500).json({
                error: 'Erro ao calcular transporte',
                message: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
};
