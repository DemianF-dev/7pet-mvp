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
                message: `O usuário ${userName} (${email}) solicitou uma recuperação de senha. Por favor, entre em contato ou gere uma nova senha no painel.`,
                type: 'SYSTEM'
            }
        })
    );

    await Promise.all(notificationPromises);

    console.log(`[NOTIFICAÇÃO ADMIN] Solicitação de senha para ${email} enviada aos admins.`);

    return {
        message: 'Sua solicitação foi enviada ao administrador. Por favor, aguarde o contato para receber sua nova senha.'
    };
};
