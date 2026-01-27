
import { Request, Response } from 'express';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const handleChat = async (req: Request, res: Response) => {
    try {
        const { messages } = req.body;

        // Ensure OpenAI Key exists
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ error: 'OpenAI API Key not configured on server' });
        }

        const result = await streamText({
            model: openai('gpt-4o-mini'),
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
                        // Mock for POC - In next steps we connect to real service
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
            maxSteps: 5
        });

        // Set headers for streaming
        // Note: In Express/Node, pipeDataStreamToResponse handles headers mostly, but sometimes we need to be explicit if using compression
        // .pipeDataStreamToResponse(res) is the standard way in AI SDK 3.1+

        result.pipeDataStreamToResponse(res);

    } catch (error) {
        console.error('Brain Error:', error);
        // If headers already sent (streaming started), we can't send JSON error
        if (!res.headersSent) {
            res.status(500).json({ error: 'Falha no processamento da IA' });
        }
    }
};
