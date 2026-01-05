import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

import prisma from '../lib/prisma';
import * as productService from '../services/productService';

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
                return res.status(400).json({ errors: error.issues });
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
            await productService.remove(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Erro ao excluir produto' });
        }
    },

    async bulkDelete(req: Request, res: Response) {
        const { ids } = req.body;
        try {
            await productService.bulkDelete(ids);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Erro ao excluir produtos em massa' });
        }
    },

    async listTrash(req: Request, res: Response) {
        try {
            const trash = await productService.listTrash();
            res.json(trash);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar lixeira' });
        }
    },

    async restore(req: Request, res: Response) {
        const { id } = req.params;
        try {
            await productService.restore(id);
            res.status(200).json({ message: 'Produto restaurado com sucesso' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao restaurar produto' });
        }
    },

    async bulkRestore(req: Request, res: Response) {
        const { ids } = req.body;
        try {
            await productService.bulkRestore(ids);
            res.status(200).json({ message: 'Produtos restaurados com sucesso' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao restaurar produtos' });
        }
    },

    async permanentRemove(req: Request, res: Response) {
        const { id } = req.params;
        try {
            await productService.permanentRemove(id);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Erro ao excluir permanentemente' });
        }
    }
};
