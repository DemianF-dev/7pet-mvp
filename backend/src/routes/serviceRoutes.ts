import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import * as serviceService from '../services/serviceService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    const services = await prisma.service.findMany();
    res.json(services);
});

router.use(authenticate);
router.use(authorize(['OPERACIONAL', 'GESTAO', 'ADMIN', 'SPA']));

router.post('/', async (req: Request, res: Response) => {
    const { name, description, basePrice, duration, category, species, minWeight, maxWeight, sizeLabel, responsibleId } = req.body;

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
            responsibleId: responsibleId || null
        }
    });
    res.status(201).json(service);
});

router.post('/bulk', async (req: Request, res: Response) => {
    const services = req.body; // Expecting array
    if (!Array.isArray(services)) {
        return res.status(400).json({ error: 'Formato inválido. Esperado um array de serviços.' });
    }

    let createdCount = 0;
    let errors = [];

    for (const s of services) {
        try {
            // Check for duplicate name
            const existing = await prisma.service.findFirst({ where: { name: s.name } });
            if (!existing) {
                await prisma.service.create({
                    data: {
                        name: s.name,
                        description: s.description || '',
                        basePrice: Number(s.basePrice),
                        duration: Number(s.duration) || 30,
                        category: s.category || 'Geral',
                        species: s.species || 'Canino',
                        minWeight: s.minWeight ? Number(s.minWeight) : null,
                        maxWeight: s.maxWeight ? Number(s.maxWeight) : null,
                        sizeLabel: s.sizeLabel
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

router.patch('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, basePrice, duration, category, species, minWeight, maxWeight, sizeLabel, responsibleId } = req.body;

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
            responsibleId: responsibleId !== undefined ? (responsibleId || null) : undefined
        }
    });
    res.json(service);
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await serviceService.remove(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir serviço' });
    }
});

router.post('/bulk-delete', async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        await serviceService.bulkDelete(ids);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir serviços em massa' });
    }
});

// Trash system routes
router.get('/trash', async (req: Request, res: Response) => {
    try {
        const trash = await serviceService.listTrash();
        res.json(trash);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar lixeira' });
    }
});

router.post('/bulk-restore', async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        await serviceService.bulkRestore(ids);
        res.status(200).json({ message: 'Serviços restaurados com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao restaurar serviços' });
    }
});

router.patch('/:id/restore', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await serviceService.restore(id);
        res.status(200).json({ message: 'Serviço restaurado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao restaurar serviço' });
    }
});

router.delete('/:id/permanent', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await serviceService.permanentRemove(id);
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Erro ao excluir permanentemente' });
    }
});

export default router;
