
import { Request, Response } from 'express';
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const handleChat = async (req: Request, res: Response) => {
    try {
        const { messages } = req.body;
        console.log(`[Brain] Chat request received. Messages: ${messages?.length}`);

        // Ensure Google API Key exists
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            console.error('[Brain] Google Gemini API Key missing');
            return res.status(500).json({ error: 'Google Gemini API Key not configured on server' });
        }

        // Set headers to disable buffering/caching for streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx/Railway proxies

        const result = await streamText({
            model: google('gemini-1.5-flash'),
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
                        console.log(`[Brain] Tool getFinancialSummary used: ${startDate} to ${endDate}`);
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
            onFinish: ({ text }) => {
                console.log('[Brain] Chat finished successfully');
            }
        });

        result.pipeDataStreamToResponse(res);

    } catch (error: any) {
        console.error('[Brain] Error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Falha no processamento da IA',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};
