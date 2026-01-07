
import { Request, Response } from 'express';
import { mapsService } from '../services/mapsService';

export const mapsController = {
    async calculate(req: Request, res: Response) {
        try {
            const { address } = req.body;

            if (!address) {
                return res.status(400).json({ error: 'Endereço é obrigatório' });
            }

            const result = await mapsService.calculateTransportDetailed(address);
            return res.json({
                ...result,
                estimatedPrice: result.total // Compatibilidade com frontend
            });
        } catch (error: any) {
            console.error('Maps Controller Error:', error);
            return res.status(500).json({
                error: 'Erro ao calcular transporte',
                details: error.message
            });
        }
    }
};
