
import { Request, Response } from 'express';
import { brainService } from '../services/BrainService';
import { pino } from 'pino';

const logger = pino({ name: 'BrainController' });

export const handleChat = async (req: Request, res: Response) => {
    try {
        const { messages } = req.body;
        logger.info({ msg: 'Chat request received', messageCount: messages?.length });

        await brainService.processChatStream(messages, res);

    } catch (error: any) {
        logger.error({ msg: 'Error in handleChat', error });
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Falha no processamento da IA',
                message: error.message
            });
        }
    }
};
