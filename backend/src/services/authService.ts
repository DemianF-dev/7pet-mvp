import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import Logger from '../lib/logger';

// CRITICAL SECURITY: No fallback! Force JWT_SECRET to be defined
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('❌ FATAL: JWT_SECRET environment variable is not defined! Application cannot start.');
}

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

export const login = async (email: string, password: string) => {
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

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return { user, token };
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
