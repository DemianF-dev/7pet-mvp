
import { Request, Response } from 'express';
import { mapsService, MapsError } from '../services/googleMapsService';

export const mapsController = {
    async calculate(req: Request, res: Response) {
        try {
            console.log('[MapsController] Received calculate request body:', req.body);
            const { address } = req.body;

            if (!address) {
                console.warn('[MapsController] Address missing in body');
                return res.status(400).json({ error: 'Endereço é obrigatório' });
            }

            const result = await mapsService.calculateTransportDetailed(address);
            return res.json({
                ...result,
                estimatedPrice: result.total // Compatibilidade com frontend
            });
        } catch (error: any) {
            console.error('Maps Controller Error:', error);

            if (error.message.includes('Route not found') || error.message.includes('NOT_FOUND')) {
                return res.status(422).json({
                    error: 'Endereço não encontrado ou rota indisponível.',
                    details: error.message
                });
            }

            if (error.message.includes('Maps API Error')) {
                return res.status(502).json({
                    error: 'Erro de comunicação com o serviço de mapas.',
                    details: error.message
                });
            }

            return res.status(500).json({
                error: 'Erro interno ao calcular transporte',
                details: error.message
            });
        }
    }
};
