import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import * as transportCalc from '../services/transportCalculationService';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

// Middleware to check MASTER role
const requireMaster = (req: Request, res: Response, next: Function) => {
    const user = (req as any).user;
    if (!user || user.role !== 'MASTER') {
        return res.status(403).json({
            ok: false,
            code: 'FORBIDDEN',
            messageUser: 'Acesso negado',
            messageDev: 'Only MASTER role can access dev endpoints'
        });
    }
    next();
};

router.use(authenticate);
router.use(requireMaster);

const ENGINE_VERSION = 'transport-engine@1.0.0';

/**
 * Normalize address for consistent checksum
 */
function normalizeAddress(addr?: string): string {
    if (!addr) return '';
    return addr.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Generate deterministic checksum
 */
function generateChecksum(scenario: any): string {
    const checksumBase = JSON.stringify({
        plan: scenario.plan,
        mode: scenario.mode,
        destinationIsThePet: scenario.destinationIsThePet,
        address1: normalizeAddress(scenario.address1),
        address2: normalizeAddress(scenario.address2),
        stopAddress: normalizeAddress(scenario.stopAddress),
        discountPercent: Number(scenario.discountPercent?.toFixed(2) || 0),
        kmRate: scenario.kmRate,
        minRate: scenario.minRate,
        engineVersion: ENGINE_VERSION
    });

    return crypto.createHash('sha256').update(checksumBase).digest('hex').slice(0, 12).toUpperCase();
}

/**
 * Transport Simulator - MASTER-only sandbox
 * POST /dev/transport/simulate
 */
router.post('/transport/simulate', async (req: Request, res: Response) => {
    try {
        console.log('[DevTransportSim] Request:', JSON.stringify(req.body, null, 2));

        // Validation
        const schema = z.object({
            plan: z.enum(['TL1', 'TL2']),
            mode: z.enum(['LEVA', 'TRAZ', 'LEVA_TRAZ']),
            destinationIsThePet: z.boolean(),
            address1: z.string().min(5, 'Endereço 1 é obrigatório'),
            address2: z.string().optional(),
            stopAddress: z.string().optional(),
            discountPercent: z.number().min(0).max(100).optional().default(0),
            kmRateOverride: z.number().positive().optional(),
            minRateOverride: z.number().positive().optional()
        });

        const data = schema.parse(req.body);

        // TL2 validation
        if (data.plan === 'TL2' && !data.destinationIsThePet && !data.address2) {
            return res.status(422).json({
                ok: false,
                code: 'MISSING_ADDRESS2',
                messageUser: 'Endereço de destino é obrigatório para TL2',
                messageDev: 'address2 is required for TL2 when destinationIsThePet=false'
            });
        }

        // Call calculation service
        const calcResult = await transportCalc.calculateTransportQuote({
            plan: data.plan,
            mode: data.mode,
            destinationIsThePet: data.destinationIsThePet,
            address1: data.address1,
            address2: data.address2,
            stopAddress: data.stopAddress,
            discountPercent: data.discountPercent
        });

        // Build scenario object (use actual rates or overrides)
        const scenario = {
            plan: data.plan,
            mode: data.mode,
            destinationIsThePet: data.destinationIsThePet,
            address1: data.address1,
            address2: data.address2 || null,
            stopAddress: data.stopAddress || null,
            discountPercent: data.discountPercent,
            kmRate: data.kmRateOverride || calcResult.settings.kmRate,
            minRate: data.minRateOverride || calcResult.settings.minRate
        };

        // Generate checksum
        const checksum = generateChecksum(scenario);
        const timestamp = new Date().toISOString();

        // Response
        return res.json({
            ok: true,
            checksum,
            engineVersion: ENGINE_VERSION,
            timestamp,
            scenario,
            legs: calcResult.legs,
            totals: {
                totalBeforeDiscount: calcResult.totals.totalBeforeDiscount,
                totalAfterDiscount: calcResult.totals.totalAfterDiscount,
                totalLevaBeforeDiscount: calcResult.totals.totalLevaBeforeDiscount,
                totalLevaAfterDiscount: calcResult.totals.totalLevaAfterDiscount,
                totalTrazBeforeDiscount: calcResult.totals.totalTrazBeforeDiscount,
                totalTrazAfterDiscount: calcResult.totals.totalTrazAfterDiscount,
                discountPercent: data.discountPercent
            }
        });

    } catch (error: any) {
        console.error('[DevTransportSim] Error:', error);

        // Zod validation errors
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                ok: false,
                code: 'VALIDATION_ERROR',
                messageUser: 'Dados inválidos',
                messageDev: error.issues,
                details: error.issues
            });
        }

        // Google Maps errors
        if (error.message?.includes('Maps') || error.message?.includes('route')) {
            const code = error.message.includes('authentication') ? 'MAPS_AUTH' :
                error.message.includes('quota') ? 'MAPS_QUOTA' : 'MAPS_ERROR';
            const status = code === 'MAPS_AUTH' ? 502 :
                code === 'MAPS_QUOTA' ? 503 : 500;

            return res.status(status).json({
                ok: false,
                code,
                messageUser: 'Erro ao calcular rota. Tente novamente.',
                messageDev: error.message
            });
        }

        // Generic error
        return res.status(500).json({
            ok: false,
            code: 'INTERNAL_ERROR',
            messageUser: 'Erro na simulação',
            messageDev: error.message || 'Unknown error'
        });
    }
});

export default router;
