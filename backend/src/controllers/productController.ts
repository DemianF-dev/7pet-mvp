import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const productSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    description: z.string().optional(),
    price: z.number().min(0, 'Preço deve ser positivo'),
    stock: z.number().int().min(0, 'Estoque deve ser positivo'),
    category: z.string().optional(),
});

export const productController = {
    async list(req: Request, res: Response) {
        try {
            const products = await prisma.product.findMany({
                orderBy: { name: 'asc' }
            });
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar produtos' });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data = productSchema.parse(req.body);
            const product = await prisma.product.create({ data });
            res.json(product);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ errors: error.errors });
            }
            res.status(500).json({ error: 'Erro ao criar produto' });
        }
    },

    async update(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const data = productSchema.partial().parse(req.body);
            const product = await prisma.product.update({
                where: { id },
                data
            });
            res.json(product);
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao atualizar produto' });
        }
    },

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        try {
            await prisma.product.delete({ where: { id } });
            res.json({ message: 'Produto excluído' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao excluir produto' });
        }
    },

    async bulkDelete(req: Request, res: Response) {
        const { ids } = req.body;
        try {
            await prisma.product.deleteMany({
                where: { id: { in: ids } }
            });
            res.json({ message: 'Produtos excluídos' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao excluir produtos em massa' });
        }
    }
};
