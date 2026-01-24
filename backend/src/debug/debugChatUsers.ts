import { PrismaClient } from '../generated';
import prisma from '../lib/prisma';
import Logger from '../lib/logger';

/**
 * Endpoint de depuração para testar busca de usuários
 */
export async function debugChatUsers(req: any, res: any) {
    try {
        Logger.info('🐛 DEBUG: Iniciando busca de usuários para chat');
        
        // Contar usuários ativos no banco
        const totalUsers = await prisma.user.count({
            where: { active: true }
        });
        
        Logger.info(`🐛 DEBUG: Total usuários ativos: ${totalUsers}`);
        
        // Buscar todos os usuários ativos (sem filtro)
        const allUsers = await prisma.user.findMany({
            where: { active: true },
            take: 10,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                division: true,
                color: true
            }
        });
        
        Logger.info(`🐛 DEBUG: Amostra de usuários: ${JSON.stringify(allUsers, null, 2)}`);
        
        // Testar a query vazia (como o frontend faz)
        const emptyQueryUsers = await prisma.user.findMany({
            where: {
                active: true,
                // Simular ID de usuário inválido para não excluir ninguém
                id: { not: 'invalid-user-id' }
            },
            take: 40,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                division: true,
                color: true
            }
        });
        
        Logger.info(`🐛 DEBUG: Usuários com query vazia: ${emptyQueryUsers.length}`);
        
        // Testar query específica
        const testQueryUsers = await prisma.user.findMany({
            where: {
                active: true,
                id: { not: 'invalid-user-id' },
                OR: [
                    { name: { contains: 'admin', mode: 'insensitive' } },
                    { email: { contains: 'admin', mode: 'insensitive' } }
                ]
            },
            take: 40,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                division: true,
                color: true
            }
        });
        
        Logger.info(`🐛 DEBUG: Usuários com query "admin": ${testQueryUsers.length}`);
        
        res.json({
            debug: true,
            totalActiveUsers: totalUsers,
            sampleUsers: allUsers,
            emptyQueryUsers: emptyQueryUsers.length,
            testQueryUsers: testQueryUsers.length,
            allUsersArray: emptyQueryUsers
        });
    } catch (error) {
        Logger.error('🐛 DEBUG: Erro na busca de usuários', error);
        res.status(500).json({ 
            debug: true,
            error: (error as Error).message,
            stack: (error as Error).stack 
        });
    }
}