import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const transportSettingsController = {
    async get(req: Request, res: Response) {
        try {
            console.log('[TransportSettings] Fetching settings...');
            let settings = await prisma.transportSettings.findFirst();

            if (!settings) {
                console.log('[TransportSettings] No settings found, returning defaults');
                return res.json({
                    kmPriceLargada: 2.0,
                    kmPriceLeva: 2.0,
                    kmPriceTraz: 2.0,
                    kmPriceRetorno: 2.0,
                    minPriceLargada: 1.5,
                    minPriceLeva: 1.5,
                    minPriceTraz: 1.5,
                    minPriceRetorno: 1.5,
                    handlingTimeLargada: 0,
                    handlingTimeLeva: 0,
                    handlingTimeTraz: 0,
                    handlingTimeRetorno: 0,
                    additionalPetSurchargePercent: 20.0,
                    knotPrice: 0,
                    medicatedBathPrice: 0
                });
            }

            console.log('[TransportSettings] Settings found:', settings);
            return res.json(settings);
        } catch (error: any) {
            console.error('[TransportSettings] Error fetching settings:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const data = req.body;
            console.log('[TransportSettings] Update request with data:', data);

            const existing = await prisma.transportSettings.findFirst();
            console.log('[TransportSettings] Existing record:', existing);

            // Helper to safe parse
            const safeFloat = (val: any, def: number) => {
                if (val === undefined || val === null || val === '') return def;
                const parsed = Number(val);
                return isNaN(parsed) ? def : parsed;
            };

            const safeInt = (val: any, def: number) => {
                if (val === undefined || val === null || val === '') return def;
                const parsed = parseInt(val, 10);
                return isNaN(parsed) ? def : parsed;
            };

            const updateData = {
                kmPriceLargada: safeFloat(data.kmPriceLargada, 2.0),
                kmPriceLeva: safeFloat(data.kmPriceLeva, 2.0),
                kmPriceTraz: safeFloat(data.kmPriceTraz, 2.0),
                kmPriceRetorno: safeFloat(data.kmPriceRetorno, 2.0),
                minPriceLargada: safeFloat(data.minPriceLargada, 1.5),
                minPriceLeva: safeFloat(data.minPriceLeva, 1.5),
                minPriceTraz: safeFloat(data.minPriceTraz, 1.5),
                minPriceRetorno: safeFloat(data.minPriceRetorno, 1.5),
                handlingTimeLargada: safeInt(data.handlingTimeLargada, 0),
                handlingTimeLeva: safeInt(data.handlingTimeLeva, 0),
                handlingTimeTraz: safeInt(data.handlingTimeTraz, 0),
                handlingTimeRetorno: safeInt(data.handlingTimeRetorno, 0),
                additionalPetSurchargePercent: safeFloat(data.additionalPetSurchargePercent, 20.0),
                knotPrice: safeFloat(data.knotPrice, 0),
                medicatedBathPrice: safeFloat(data.medicatedBathPrice, 0),
            };

            console.log('[TransportSettings] Processed update data:', updateData);

            if (existing) {
                console.log('[TransportSettings] Updating existing record...');
                const updated = await prisma.transportSettings.update({
                    where: { id: existing.id },
                    data: updateData
                });
                console.log('[TransportSettings] Successfully updated:', updated);
                return res.json(updated);
            } else {
                console.log('[TransportSettings] Creating new record...');
                const created = await prisma.transportSettings.create({
                    data: updateData
                });
                console.log('[TransportSettings] Successfully created:', created);
                return res.json(created);
            }
        } catch (error: any) {
            console.error('[TransportSettings] Error updating settings:', error);
            return res.status(500).json({ error: 'Internal server error', details: error });
        }
    }
};
