import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import Logger from '../lib/logger';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

// CRITICAL SECURITY: No fallback! Force JWT_SECRET to be defined
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!JWT_SECRET) {
    throw new Error('❌ FATAL: JWT_SECRET environment variable is not defined! Application cannot start.');
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export const register = async (data: any) => {
    const { email, password, name, role = 'CLIENTE' } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('O usuário já existe');

    // Initial password hashing if provided, otherwise we'll update with seqId after creation
    let passwordHash = password ? await bcrypt.hash(password, 10) : null;

    let staffId = null;
    if (role !== 'CLIENTE') {
        const lastStaff = await prisma.user.findFirst({
            where: { staffId: { not: null } },
            orderBy: { staffId: 'desc' },
            select: { staffId: true }
        });
        staffId = (lastStaff?.staffId || 0) + 1;
    }

    let user = await prisma.user.create({
        data: {
            email,
            passwordHash: passwordHash || "TEMPORARY", // Fallback
            plainPassword: password || null,
            role,
            name: name || `${data.firstName || ''} ${data.lastName || ''} `.trim(),
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            extraEmails: data.extraEmails || [],
            extraPhones: data.extraPhones || [],
            extraAddresses: data.extraAddresses || [],
            address: data.address,
            birthday: data.birthday ? new Date(data.birthday) : undefined,
            staffId,
            customer: role === 'CLIENTE' ? {
                create: {
                    name: name || `${data.firstName || ''} ${data.lastName || ''} `.trim(),
                    phone: data.phone,
                    address: data.address,
                    discoverySource: data.discoverySource,
                    communicationPrefs: data.communicationPrefs || [],
                    communicationOther: data.communicationOther,
                    additionalGuardians: data.additionalGuardians || [],
                    internalNotes: data.internalNotes
                }
            } : undefined
        },
        include: {
            customer: true
        }
    });

    // If no password was provided, set it to the seqId as requested
    if (!password) {
        const tempPassword = String((user as any).seqId);
        const newHash = await bcrypt.hash(tempPassword, 10);
        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newHash,
                plainPassword: tempPassword
            },
            include: { customer: true }
        });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return { user, token };
};

export const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email },
                { extraEmails: { array_contains: email } }
            ]
        },
        include: { customer: true }
    });

    if (!user || !user.passwordHash) throw new Error('Credenciais inválidas');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new Error('Credenciais inválidas');

    const expiresIn = rememberMe ? '30d' : '7d';
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn });

    return { user, token };
};

export const loginWithGoogle = async (token: string) => {
    try {
        let payload: any;

        try {
            // Try as ID Token first (safer, if provided)
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (e) {
            // Fallback: treat as Access Token and fetch profile
            Logger.info('Token não é um ID Token válido, tentando como Access Token...');
            const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            payload = response.data;
        }


        if (!payload || !payload.email) {
            throw new Error('Falha ao obter dados do Google');
        }

        const { email, name, given_name, family_name, picture } = payload;

        // Check if user exists
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { extraEmails: { array_contains: email } }
                ]
            },
            include: { customer: true }
        });

        // If not, create a new client user
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || `${given_name || ''} ${family_name || ''}`.trim(),
                    firstName: given_name,
                    lastName: family_name,
                    role: 'CLIENTE',
                    passwordHash: 'GOOGLE_AUTH', // Placeholder
                    customer: {
                        create: {
                            name: name || `${given_name || ''} ${family_name || ''}`.trim(),
                        }
                    }
                },
                include: { customer: true }
            });
            Logger.info(`Novo usuário criado via Google: ${email}`);
        } else {
            Logger.info(`Usuário logado via Google: ${email}`);
        }

        // Generate our own JWT
        const tokenResult = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

        return { user, token: tokenResult };
    } catch (error: any) {
        Logger.error(`Erro no Google Login: ${error.message}`);
        throw new Error('Falha na autenticação com o Google');
    }
};


export const forgotPassword = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { customer: true }
    });

    if (!user) throw new Error('Usuário não encontrado');

    // Find all Admin users to notify
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' }
    });

    // Create notifications for all admins
    const userName = user.name || user.customer?.name || 'Cliente';

    const notificationPromises = admins.map(admin =>
        prisma.notification.create({
            data: {
                userId: admin.id,
                title: 'Solicitação de Nova Senha',
                message: `O usuário ${userName} (${email}) solicitou uma recuperação de senha.Por favor, entre em contato ou gere uma nova senha no painel.`,
                type: 'SYSTEM'
            }
        })
    );

    await Promise.all(notificationPromises);

    Logger.info(`[NOTIFICAÇÃO ADMIN] Solicitação de senha para ${email} enviada aos admins.`);

    return {
        message: 'Sua solicitação foi enviada ao administrador. Por favor, aguarde o contato para receber sua nova senha.'
    };
};
