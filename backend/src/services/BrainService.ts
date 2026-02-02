
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { pino } from 'pino';

const logger = pino({ name: 'BrainService' });

export class BrainService {
    async processChatStream(messages: any[], res: any) {
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            logger.error('Google Gemini API Key missing');
            throw new Error('Google Gemini API Key not configured');
        }

        logger.info({ msg: 'Starting chat stream', messageCount: messages?.length });

        // Set streaming headers
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        try {
            const result = await streamText({
                model: google('gemini-1.5-flash') as any,
                messages,
                system: `Você é o "Cérebro 7Pet", um assistente inteligente para administradores do sistema de Pet Shop.
                Você tem acesso a ferramentas para buscar dados do sistema.
                SEMPRE responda em Português do Brasil.
                Se não souber a resposta, diga que não sabe.
                Nunca invente dados.`,
                tools: {
                    getFinancialSummary: {
                        description: 'Busca o resumo financeiro (faturamento) de um período',
                        parameters: z.object({
                            startDate: z.string().describe('Data inicial YYYY-MM-DD'),
                            endDate: z.string().describe('Data final YYYY-MM-DD'),
                        }),
                        execute: async ({ startDate, endDate }) => {
                            logger.info({ msg: 'Tool execution: getFinancialSummary', startDate, endDate });
                            return {
                                revenue: 15430.00,
                                expenses: 4320.50,
                                profit: 11109.50,
                                period: `${startDate} a ${endDate}`,
                                note: "Dados simulados para teste"
                            };
                        }
                    }
                },
                maxSteps: 5,
                onFinish: () => {
                    logger.info('Chat stream finished successfully');
                }
            });

            return result.pipeDataStreamToResponse(res);
        } catch (error: any) {
            logger.error({ msg: 'Error processing chat stream', error });
            throw error;
        }
    }
}

export const brainService = new BrainService();
