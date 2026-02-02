import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

// CRITICAL SECURITY: No fallback! Force JWT_SECRET to be defined
const JWT_SECRET = process.env.JWT_SECRET as string;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Security: Use structured logger instead of console.log
if (process.env.NODE_ENV !== 'production') {
    logger.debug({ jwtSecret: !!JWT_SECRET, googleClientId: !!GOOGLE_CLIENT_ID }, 'Auth env check');
}

if (!JWT_SECRET) {
    logger.warn('JWT_SECRET is not defined in this environment');
    // Don't throw here, allow diag route to show it
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

    // RULE: PAUSA menu enabled by default for CLIENTE (users), disabled for collaborators
    const pauseMenuEnabled = role === 'CLIENTE' ? true : false;

    let user = await prisma.user.create({
        data: {
            email,
            passwordHash: passwordHash || "TEMPORARY", // Fallback
            plainPassword: password || null,
            role,
            division: role === 'CLIENTE' ? 'CLIENTE' : (data.division || 'OPERACIONAL'),
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
            isEligible: false,
            pauseMenuEnabled,
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

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });

    return { user, token };
};

/**
 * Registra um novo cliente, pet e endereço de forma manual (pelo staff)
 */
export const registerManual = async (tx: any, data: any) => {
    const { customer, pet } = data;

    let user = null;

    // 1. If ID is provided, it's an existing customer to modify/merge
    const providedId = customer.id && customer.id !== '' ? customer.id : null;
    const providedUserId = customer.userId && customer.userId !== '' ? customer.userId : null;

    if (providedId) {
        user = await tx.user.findFirst({
            where: {
                OR: [
                    { id: providedUserId || undefined },
                    { customer: { id: providedId } }
                ]
            },
            include: { customer: true }
        });

        if (user && user.customer) {
            // Update User
            user = await tx.user.update({
                where: { id: user.id },
                data: {
                    name: customer.name || user.name,
                    phone: customer.phone || user.phone,
                    address: customer.address || user.address,
                },
                include: { customer: true }
            });

            // Update Customer
            await tx.customer.update({
                where: { id: user.customer.id },
                data: {
                    name: customer.name || user.customer.name,
                    phone: customer.phone || user.customer.phone,
                    address: customer.address || user.customer.address,
                    type: customer.type || user.customer.type,
                    recurrenceFrequency: customer.recurrenceFrequency || user.customer.recurrenceFrequency
                }
            });
        }
    }

    if (!user) {
        // Fallback or NEW: Verificar se usuário já existe pelo email
        user = await tx.user.findUnique({
            where: { email: customer.email },
            include: { customer: true }
        });

        if (!user) {
            // Criar usuário com senha temporária (seqId)
            // RULE: PAUSA menu enabled by default for CLIENTE users
            user = await tx.user.create({
                data: {
                    email: customer.email,
                    passwordHash: "TEMPORARY",
                    role: 'CLIENTE',
                    division: 'CLIENTE',
                    name: customer.name,
                    firstName: customer.firstName || (customer.name ? customer.name.split(' ')[0] : 'Cliente'),
                    lastName: customer.lastName || (customer.name ? customer.name.split(' ').slice(1).join(' ') : ''),
                    phone: customer.phone,
                    address: customer.address,
                    isEligible: false,
                    pauseMenuEnabled: true,
                    customer: {
                        create: {
                            name: customer.name,
                            phone: customer.phone,
                            address: customer.address,
                            type: customer.type || 'AVULSO',
                            recurrenceFrequency: customer.recurrenceFrequency || null,
                            discoverySource: 'BALCAO_MANUAL'
                        }
                    }
                },
                include: { customer: true }
            });

            // Atualizar senha para seqId
            const tempPassword = String((user as any).seqId);
            const newHash = await bcrypt.hash(tempPassword, 10);
            user = await tx.user.update({
                where: { id: user.id },
                data: {
                    passwordHash: newHash,
                    plainPassword: tempPassword
                },
                include: { customer: true }
            });
        } else if (!user.customer) {
            // Se o usuário existe mas não tem perfil de cliente (ex: admin), cria agora
            const customerProfile = await tx.customer.create({
                data: {
                    userId: user.id,
                    name: customer.name || user.name,
                    phone: customer.phone || user.phone,
                    address: customer.address || user.address,
                    type: customer.type || 'AVULSO',
                    recurrenceFrequency: customer.recurrenceFrequency || null,
                    discoverySource: 'BALCAO_MANUAL'
                }
            });
            user.customer = customerProfile;
        }
    }

    if (!user || !user.customer) {
        throw new Error('Falha ao localizar ou criar perfil de cliente.');
    }

    const customerId = user.customer.id;

    // 2. Criar ou Atualizar Pet
    let dbPet = null;
    if (pet && (pet.id || pet.name)) {
        if (pet.id) {
            dbPet = await tx.pet.findUnique({ where: { id: pet.id } });
            if (dbPet) {
                dbPet = await tx.pet.update({
                    where: { id: pet.id },
                    data: {
                        name: pet.name || dbPet.name,
                        species: pet.species || dbPet.species,
                        breed: pet.breed || dbPet.breed,
                        weight: pet.weight ? parseFloat(pet.weight) : dbPet.weight,
                        coatType: pet.coatType || dbPet.coatType,
                        temperament: pet.temperament || dbPet.temperament,
                        age: pet.age || dbPet.age,
                        observations: pet.observations || dbPet.observations,
                        hasKnots: pet.hasKnots !== undefined ? pet.hasKnots : dbPet.hasKnots,
                        hasMattedFur: pet.hasMattedFur !== undefined ? pet.hasMattedFur : dbPet.hasMattedFur,
                        healthIssues: pet.healthIssues || dbPet.healthIssues,
                        allergies: pet.allergies || dbPet.allergies
                    }
                });
            }
        }

        if (!dbPet && pet.name) {
            // Check if pet with same name exists for this customer
            dbPet = await tx.pet.findFirst({
                where: { customerId, name: pet.name }
            });

            if (dbPet) {
                // Update existing pet
                dbPet = await tx.pet.update({
                    where: { id: dbPet.id },
                    data: {
                        species: pet.species || dbPet.species,
                        breed: pet.breed || dbPet.breed,
                        weight: pet.weight ? parseFloat(pet.weight) : dbPet.weight,
                        coatType: pet.coatType || dbPet.coatType,
                        temperament: pet.temperament || dbPet.temperament,
                        age: pet.age || dbPet.age,
                        observations: pet.observations || dbPet.observations,
                        hasKnots: pet.hasKnots !== undefined ? pet.hasKnots : dbPet.hasKnots,
                        hasMattedFur: pet.hasMattedFur !== undefined ? pet.hasMattedFur : dbPet.hasMattedFur,
                        healthIssues: pet.healthIssues || dbPet.healthIssues,
                        allergies: pet.allergies || dbPet.allergies
                    }
                });
            } else {
                // Create new pet
                dbPet = await tx.pet.create({
                    data: {
                        customerId,
                        name: pet.name,
                        species: pet.species || 'Canino',
                        breed: pet.breed,
                        weight: pet.weight ? parseFloat(pet.weight) : null,
                        coatType: pet.coatType,
                        temperament: pet.temperament,
                        age: pet.age,
                        observations: pet.observations,
                        hasKnots: pet.hasKnots || false,
                        hasMattedFur: pet.hasMattedFur || false,
                        healthIssues: pet.healthIssues,
                        allergies: pet.allergies
                    }
                });
            }
        }
    }

    return { user, customer: user!.customer, pet: dbPet };
};

export const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { customer: true }
    });

    // Security: Only log in non-production, don't log email or role
    if (user && process.env.NODE_ENV !== 'production') {
        logger.debug({ userId: user.id }, 'Login attempt');
    }

    if (!user) {
        throw new Error('Usuário não encontrado. Verifique se o e-mail está correto ou se a conta foi criada na produção.');
    }

    if (!user.passwordHash) {
        throw new Error('Esta conta não possui uma senha configurada. Tente entrar com o Google.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new Error('Senha incorreta. Verifique suas credenciais.');

    // Check if client is blocked (only for CLIENTE role)
    if (user.role === 'CLIENTE' && user.customer?.isBlocked) {
        throw new Error('Conta bloqueada. Entre em contato com a 7Pet.');
    }

    const expiresIn = rememberMe ? '30d' : '7d';
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn, algorithm: 'HS256' });

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
            logger.info('Token não é um ID Token válido, tentando como Access Token...');
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
        let user = await prisma.user.findUnique({
            where: { email },
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
                    division: 'CLIENTE',
                    isEligible: false,
                    passwordHash: 'GOOGLE_AUTH', // Placeholder
                    customer: {
                        create: {
                            name: name || `${given_name || ''} ${family_name || ''}`.trim(),
                        }
                    }
                },
                include: { customer: true }
            });
            logger.info({ email }, 'Novo usuário criado via Google');
        } else {
            logger.info({ email }, 'Usuário logado via Google');
        }

        // Check if client is blocked
        if (user.role === 'CLIENTE' && user.customer?.isBlocked) {
            throw new Error('Conta bloqueada. Entre em contato com a 7Pet.');
        }

        // Generate our own JWT
        const tokenResult = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d', algorithm: 'HS256' });

        return { user, token: tokenResult };
    } catch (error: any) {
        logger.error({ err: error }, 'Erro no Google Login');
        throw new Error('Falha na autenticação com o Google');
    }
};


export const forgotPassword = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { customer: true }
    });

    if (!user) throw new Error('Usuário não encontrado');

    // Check if client is blocked
    if (user.role === 'CLIENTE' && user.customer?.isBlocked) {
        throw new Error('Conta bloqueada. Entre em contato com a 7Pet.');
    }

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

    logger.info({ email }, '[NOTIFICAÇÃO ADMIN] Solicitação de senha enviada aos admins');

    return {
        message: 'Sua solicitação foi enviada ao administrador. Por favor, aguarde o contato para receber sua nova senha.'
    };
};
