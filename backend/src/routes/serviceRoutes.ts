import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import * as serviceService from '../services/serviceService';
import * as auditService from '../services/auditService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    const services = await prisma.service.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' }
    });
    res.json(services);
});

router.use(authenticate);
router.use(authorize(['OPERACIONAL', 'GESTAO', 'ADMIN', 'SPA', 'COMERCIAL']));

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description, basePrice, duration, category, species, minWeight, maxWeight, sizeLabel, coatType, type, bathCategory, groomingType, notes, responsibleId } = req.body;

        const existing = await prisma.service.findFirst({ where: { name } });
        if (existing) {
            return res.status(400).json({ error: 'Já existe um serviço com este nome.' });
        }
        const service = await prisma.service.create({
            data: {
                name,
                description,
                basePrice,
                duration,
                category,
                species: species || 'Canino',
                minWeight: minWeight ? Number(minWeight) : null,
                maxWeight: maxWeight ? Number(maxWeight) : null,
                sizeLabel,
                coatType,
                type,
                bathCategory,
                groomingType,
                notes,
                responsibleId: responsibleId || null
            }
        });

        const auditContext = (req as any).audit;
        if (auditContext) {
            await auditService.logEvent(auditContext, {
                targetType: 'SERVICE',
                targetId: service.id,
                action: 'SERVICE_CREATED',
                summary: `Serviço criado: ${service.name}`,
                after: service
            });
        }

        res.status(201).json(service);
    } catch (error: any) {
        next(error);
    }
});

router.post('/bulk', async (req: Request, res: Response) => {
    const services = req.body;
    if (!Array.isArray(services)) {
        return res.status(400).json({ error: 'Formato inválido. Esperado um array de serviços.' });
    }

    let createdCount = 0;
    let errors = [];

    for (const s of services) {
        try {
            const serviceType = s.type || 'Banho';
            const speciesText = s.species === 'Canino' ? 'Cão' : 'Gato';

            let finalName = s.name;
            if (!finalName || finalName === 'AUTOMATICO') {
                if (serviceType === 'Banho') {
                    finalName = `Banho ${s.bathCategory || 'Tradicional'} ${speciesText} ${s.sizeLabel || 'Médio'} - Pelagem ${s.coatType || 'Curto'}`;
                } else if (serviceType === 'Tosa') {
                    finalName = `Tosa ${s.groomingType || 'Higiênica'} ${speciesText} ${s.sizeLabel || 'Médio'}`;
                } else {
                    finalName = `Serviço ${speciesText} Personalizado`;
                }
            }

            const existing = await prisma.service.findFirst({ where: { name: finalName } });
            if (!existing) {
                await prisma.service.create({
                    data: {
                        name: finalName,
                        description: s.description || '',
                        basePrice: Number(s.basePrice),
                        duration: Number(s.duration) || 30,
                        category: s.category || (serviceType === 'Outros' ? 'Geral' : 'Estética'),
                        type: serviceType,
                        bathCategory: s.bathCategory || (serviceType === 'Banho' ? 'Tradicional' : null),
                        groomingType: s.groomingType || (serviceType === 'Tosa' ? 'Higiênica' : null),
                        species: s.species || 'Canino',
                        sizeLabel: s.sizeLabel || 'Médio',
                        coatType: s.coatType || (serviceType === 'Banho' ? 'Curto' : null),
                        notes: s.notes
                    }
                });
                createdCount++;
            }
        } catch (err: any) {
            errors.push(`Erro ao criar ${s.name}: ${err.message}`);
        }
    }

    res.json({ message: `${createdCount} serviços importados com sucesso.`, errors });
});

router.post('/bulk-update', async (req: Request, res: Response) => {
    try {
        const { ids, data } = req.body;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'IDs inválidos' });
        }

        const before = await prisma.service.findMany({ where: { id: { in: ids } } });

        await prisma.service.updateMany({
            where: { id: { in: ids } },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });

        const auditContext = (req as any).audit;
        if (auditContext) {
            await auditService.logEvent(auditContext, {
                targetType: 'SERVICE',
                action: 'BULK_UPDATE' as any,
                summary: `Atualização em massa de ${ids.length} serviços`,
                before,
                after: { data, ids }
            });
        }

        res.json({ message: `${ids.length} serviços atualizados.` });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Erro ao atualizar serviços em massa' });
    }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, description, basePrice, duration, category, species, minWeight, maxWeight, sizeLabel, coatType, type, bathCategory, groomingType, notes, responsibleId } = req.body;

        if (name) {
            const existing = await prisma.service.findFirst({
                where: {
                    name,
                    NOT: { id }
                }
            });
            if (existing) {
                return res.status(400).json({ error: 'Já existe um serviço com este nome.' });
            }
        }

        const before = await prisma.service.findUnique({ where: { id } });

        const service = await prisma.service.update({
            where: { id },
            data: {
                name,
                description,
                basePrice,
                duration,
                category,
                species,
                minWeight: minWeight !== undefined ? (minWeight ? Number(minWeight) : null) : undefined,
                maxWeight: maxWeight !== undefined ? (maxWeight ? Number(maxWeight) : null) : undefined,
                sizeLabel,
                coatType,
                type,
                bathCategory,
                groomingType,
                notes,
                responsibleId: responsibleId !== undefined ? (responsibleId || null) : undefined
            }
        });

        const auditContext = (req as any).audit;
        if (auditContext && before) {
            await auditService.logEvent(auditContext, {
                targetType: 'SERVICE',
                targetId: service.id,
                action: 'SERVICE_UPDATED',
                summary: `Serviço atualizado: ${service.name}`,
                before,
                after: service,
                revertible: true,
                revertStrategy: 'PATCH'
            });
        }

        res.json(service);
    } catch (error: any) {
        next(error);
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const service = await prisma.service.findUnique({ where: { id } });
        await serviceService.remove(id);

        const auditContext = (req as any).audit;
        if (auditContext && service) {
            await auditService.logEvent(auditContext, {
                targetType: 'SERVICE',
                targetId: id,
                action: 'SERVICE_DELETED',
                summary: `Serviço movido para a lixeira: ${service.name}`,
                before: service,
                revertible: true,
                revertStrategy: 'RESTORE_SOFT_DELETE'
            });
        }

        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao excluir serviço' });
    }
});

router.post('/bulk-delete', async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        const services = await prisma.service.findMany({ where: { id: { in: ids } } });
        await serviceService.bulkDelete(ids);

        const auditContext = (req as any).audit;
        if (auditContext && services.length > 0) {
            await auditService.logEvent(auditContext, {
                targetType: 'SERVICE',
                action: 'BULK_DELETE' as any,
                summary: `${ids.length} serviços movidos para a lixeira`,
                before: services,
                revertible: true,
                revertStrategy: 'RESTORE_SOFT_DELETE'
            });
        }

        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao excluir serviços em massa' });
    }
});

// Trash system routes
router.get('/trash', async (req: Request, res: Response) => {
    try {
        const trash = await serviceService.listTrash();
        res.json(trash);
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao listar lixeira' });
    }
});

router.delete('/:id/permanent', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const service = await prisma.service.findUnique({ where: { id } });
        await serviceService.permanentRemove(id);

        const auditContext = (req as any).audit;
        if (auditContext && service) {
            await auditService.logEvent(auditContext, {
                targetType: 'SERVICE',
                targetId: id,
                action: 'SERVICE_DELETED_PERMANENT' as any,
                summary: `Serviço excluído PERMANENTEMENTE: ${service.name}`,
                before: service,
                revertible: false
            });
        }

        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Erro ao excluir permanentemente' });
    }
});

router.post('/bulk-restore', async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        const services = await prisma.service.findMany({ where: { id: { in: ids } } });
        await serviceService.bulkRestore(ids);

        const auditContext = (req as any).audit;
        if (auditContext && services.length > 0) {
            await auditService.logEvent(auditContext, {
                targetType: 'SERVICE',
                action: 'BULK_RESTORE' as any,
                summary: `${ids.length} serviços restaurados da lixeira`,
                after: services
            });
        }

        res.status(200).json({ message: 'Serviços restaurados com sucesso' });
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao restaurar serviços' });
    }
});

router.patch('/:id/restore', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await serviceService.restore(id);
        const service = await prisma.service.findUnique({ where: { id } });

        const auditContext = (req as any).audit;
        if (auditContext && service) {
            await auditService.logEvent(auditContext, {
                targetType: 'SERVICE',
                targetId: id,
                action: 'SERVICE_RESTORED' as any,
                summary: `Serviço restaurado da lixeira: ${service.name}`,
                after: service
            });
        }

        res.status(200).json({ message: 'Serviço restaurado com sucesso' });
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao restaurar serviço' });
    }
});

export default router;
