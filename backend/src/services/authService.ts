import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export const register = async (data: any) => {
    const { email, password, name, role = 'CLIENTE' } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('O usuário já existe');

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            role,
            customer: role === 'CLIENTE' ? {
                create: { name }
            } : undefined
        },
        include: {
            customer: true
        }
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return { user, token };
};

export const login = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { customer: true }
    });

    if (!user || !user.passwordHash) throw new Error('Credenciais inválidas');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new Error('Credenciais inválidas');

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return { user, token };
};

export const forgotPassword = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Usuário não encontrado');

    // Generate a temporary password (6 characters)
    const tempPassword = Math.random().toString(36).substring(2, 8).toUpperCase();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
    });

    // NOTE: In a production environment, you would send this via email.
    // For now, we simulate the email sending.
    console.log(`[EMAIL SIMULADO] Enviando nova senha para ${email}: ${tempPassword}`);

    return {
        message: 'Uma nova senha provisória foi enviada para o seu email.',
        debugTempPassword: tempPassword
    };
};
