import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    const services = await prisma.service.findMany();
    res.json(services);
});

router.use(authenticate);
router.use(authorize(['OPERACIONAL', 'GESTAO', 'ADMIN', 'SPA']));

router.post('/', async (req: Request, res: Response) => {
    const { name, description, basePrice, duration, category } = req.body;

    const existing = await prisma.service.findFirst({ where: { name } });
    if (existing) {
        return res.status(400).json({ error: 'Já existe um serviço com este nome.' });
    }

    const service = await prisma.service.create({
        data: { name, description, basePrice, duration, category }
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
                        category: s.category || 'Geral'
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
    const { name, description, basePrice, duration, category } = req.body;

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
        data: { name, description, basePrice, duration, category }
    });
    res.json(service);
});

router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.service.delete({ where: { id } });
    res.status(204).send();
});

export default router;
