import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { logError } from '../utils/logger';

export const quotePresetController = {
    async createPreset(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const { name, customerId, petId, type, origin, destination, stops } = req.body;

            if (!customerId) return res.status(400).json({ error: 'Cliente é obrigatório' });
            if (!name) return res.status(400).json({ error: 'Nome do favorito é obrigatório' });

            const preset = await prisma.routePreset.create({
                data: {
                    customerId,
                    petId,
                    name,
                    type,
                    origin,
                    destination,
                    stops: stops ? stops : undefined,
                    routeJson: { origin, destination, stops, type },
                    version: 1,
                    lastUsedAt: new Date()
                }
            });

            return res.status(201).json(preset);
        } catch (error: any) {
            logError('Erro ao criar favorito de rota:', error);
            return res.status(500).json({ error: 'Erro ao salvar favorito' });
        }
    },

    async listPresets(req: Request, res: Response) {
        try {
            const { customerId } = req.query;
            if (!customerId) return res.status(400).json({ error: 'Cliente é obrigatório' });

            const presets = await prisma.routePreset.findMany({
                where: { customerId: String(customerId) },
                orderBy: { createdAt: 'desc' },
                include: { pet: { select: { name: true } } }
            });

            return res.json(presets);
        } catch (error: any) {
            logError('Erro ao listar favoritos:', error);
            return res.status(500).json({ error: 'Erro ao listar favoritos' });
        }
    },

    async deletePreset(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.routePreset.delete({ where: { id } });
            return res.status(204).send();
        } catch (error: any) {
            logError('Erro ao excluir favorito:', error);
            return res.status(500).json({ error: 'Erro ao excluir favorito' });
        }
    }
};
