import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { z } from 'zod';
import prisma from '../lib/prisma';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['CLIENTE', 'OPERACIONAL', 'GESTAO', 'ADMIN']).optional(),
});

const updateMeSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: Request, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);
        const result = await authService.register(data);
        console.log('Usuário registrado com sucesso:', result.user.email);
        res.status(201).json(result);
    } catch (error: any) {
        console.error('ERRO AO REGISTRAR USUÁRIO:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const result = await authService.login(email, password);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        res.status(401).json({ error: error.message });
    }
};

export const getMe = async (req: any, res: Response) => {
    try {
        // req.user is set by authMiddleware
        res.json(req.user);
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
};

export const updateMe = async (req: any, res: Response) => {
    try {
        const data = updateMeSchema.parse(req.body);
        const userId = req.user.id;
        const customerId = req.user.customer?.id;

        if (customerId) {
            await prisma.customer.update({
                where: { id: customerId },
                data: {
                    name: data.name,
                    phone: data.phone,
                    address: data.address,
                }
            });
        }

        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { customer: true }
        });

        res.json(updatedUser);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        res.status(500).json({ error: error.message });
    }
};
