import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { z } from 'zod';
import prisma from '../lib/prisma';
import logger, { logInfo, logError } from '../utils/logger';
import bcrypt from 'bcryptjs';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).optional(), // Optional, defaults to seqId
    name: z.string().optional(),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    phone: z.string(),
    role: z.enum(['CLIENTE', 'OPERACIONAL', 'GESTAO', 'ADMIN', 'SPA', 'MASTER']).optional(),
    discoverySource: z.string().optional(),
    communicationPrefs: z.array(z.string()).optional(),
    communicationOther: z.string().optional(),
    additionalGuardians: z.array(z.any()).optional(),
});

const updateMeSchema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    extraEmails: z.array(z.string()).optional(),
    password: z.string().min(6).optional(),
    phone: z.string().optional(),
    extraPhones: z.array(z.string()).optional(),
    address: z.string().optional(),
    extraAddresses: z.array(z.string()).optional(),
    document: z.string().optional(),
    birthday: z.string().optional(),
    notes: z.string().optional(),
    discoverySource: z.string().optional(),
    communicationPrefs: z.array(z.string()).optional(),
    communicationOther: z.string().optional(),
    additionalGuardians: z.array(z.any()).optional(),
    showTutorial: z.boolean().optional(),
    color: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    rememberMe: z.boolean().optional().default(false),
});

export const register = async (req: Request, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);
        const result = await authService.register(data);
        logger.info(`Usuário registrado com sucesso: ${result.user.email}`);
        res.status(201).json(result);
    } catch (error: any) {
        logError(`ERRO AO REGISTRAR USUÁRIO:`, error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password, rememberMe } = loginSchema.parse(req.body);
        const result = await authService.login(email, password, rememberMe);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        res.status(401).json({ error: error.message });
    }
};

export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: 'Token do Google é obrigatório' });
        }
        const result = await authService.loginWithGoogle(idToken);
        res.json(result);
    } catch (error: any) {
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

        // CPF Management Rule: For "client" users, the CPF should only be viewable and settable by collaborators, 
        // with clients only able to view or input their CPF but not modify or delete it once set.
        if (req.user.role === 'CLIENTE' && req.user.document && data.document !== undefined && data.document !== req.user.document) {
            return res.status(403).json({ error: 'O CPF não pode ser alterado ou removido após ter sido informado. Entre em contato com o suporte se precisar de correções.' });
        }

        const updateData: any = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            extraEmails: data.extraEmails,
            phone: data.phone,
            extraPhones: data.extraPhones,
            address: data.address,
            extraAddresses: data.extraAddresses,
            document: data.document,
            notes: data.notes,
            showTutorial: data.showTutorial,
            color: data.color,
        };

        if (data.firstName || data.lastName) {
            updateData.name = `${data.firstName || req.user.firstName || ''} ${data.lastName || req.user.lastName || ''}`.trim();
        }

        if (data.birthday) {
            updateData.birthday = new Date(data.birthday);
        }

        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }

        // Clean up undefined values
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: { customer: true }
        });

        if (customerId) {
            const customerUpdateData: any = {
                name: updateData.name,
                cpf: data.document, // Sync with User.document
                phone: data.phone,
                address: data.address,
                discoverySource: data.discoverySource,
                communicationPrefs: data.communicationPrefs,
                communicationOther: data.communicationOther,
                additionalGuardians: data.additionalGuardians,
            };

            // Clean up undefined values
            Object.keys(customerUpdateData).forEach(key => customerUpdateData[key] === undefined && delete customerUpdateData[key]);

            await prisma.customer.update({
                where: { id: customerId },
                data: customerUpdateData
            });
        }

        res.json(updatedUser);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        res.status(500).json({ error: error.message });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = z.object({ email: z.string().email() }).parse(req.body);
        const result = await authService.forgotPassword(email);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Email inválido' });
        }
        res.status(400).json({ error: error.message });
    }
};
