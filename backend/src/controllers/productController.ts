import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

import prisma from '../lib/prisma';
import * as productService from '../services/productService';
import * as auditService from '../services/auditService';


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
                where: { deletedAt: null },
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

            const auditContext = (req as any).audit;
            if (auditContext) {
                await auditService.logEvent(auditContext, {
                    targetType: 'PRODUCT' as any,
                    targetId: product.id,
                    action: 'PRODUCT_CREATED' as any,
                    summary: `Produto criado: ${product.name}`,
                    after: product
                });
            }

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
            const before = await prisma.product.findUnique({ where: { id } });
            const product = await prisma.product.update({
                where: { id },
                data
            });

            const auditContext = (req as any).audit;
            if (auditContext) {
                await auditService.logEvent(auditContext, {
                    targetType: 'PRODUCT' as any,
                    targetId: product.id,
                    action: 'PRODUCT_UPDATED' as any,
                    summary: `Produto atualizado: ${product.name}`,
                    before,
                    after: product
                });
            }

            res.json(product);
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao atualizar produto' });
        }
    },

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const before = await prisma.product.findUnique({ where: { id } });
            await productService.remove(id);

            const auditContext = (req as any).audit;
            if (auditContext && before) {
                await auditService.logEvent(auditContext, {
                    targetType: 'PRODUCT' as any,
                    targetId: id,
                    action: 'PRODUCT_DELETED' as any,
                    summary: `Produto movido para lixeira: ${before.name}`,
                    before
                });
            }

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Erro ao excluir produto' });
        }
    },

    async bulkDelete(req: Request, res: Response) {
        const { ids } = req.body;
        try {
            const before = await prisma.product.findMany({ where: { id: { in: ids } } });
            await productService.bulkDelete(ids);

            const auditContext = (req as any).audit;
            if (auditContext) {
                await auditService.logEvent(auditContext, {
                    targetType: 'BULK_ACTION' as any,
                    action: 'BULK_DELETE' as any,
                    summary: `Exclusão em massa de ${ids.length} produtos`,
                    meta: { targetType: 'PRODUCT', ids },
                    before
                });
            }

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
            const product = await prisma.product.findUnique({ where: { id } });

            const auditContext = (req as any).audit;
            if (auditContext && product) {
                await auditService.logEvent(auditContext, {
                    targetType: 'PRODUCT' as any,
                    targetId: id,
                    action: 'PRODUCT_UPDATED' as any, // Restore is a form of update
                    summary: `Produto restaurado da lixeira: ${product.name}`,
                    after: product
                });
            }

            res.status(200).json({ message: 'Produto restaurado com sucesso' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao restaurar produto' });
        }
    },

    async bulkRestore(req: Request, res: Response) {
        const { ids } = req.body;
        try {
            await productService.bulkRestore(ids);
            const after = await prisma.product.findMany({ where: { id: { in: ids } } });

            const auditContext = (req as any).audit;
            if (auditContext) {
                await auditService.logEvent(auditContext, {
                    targetType: 'BULK_ACTION' as any,
                    action: 'BULK_UPDATE' as any,
                    summary: `Restauração em massa de ${ids.length} produtos`,
                    meta: { targetType: 'PRODUCT', ids },
                    after
                });
            }

            res.status(200).json({ message: 'Produtos restaurados com sucesso' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao restaurar produtos' });
        }
    },

    async permanentRemove(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const before = await prisma.product.findUnique({ where: { id } });
            await productService.permanentRemove(id);

            const auditContext = (req as any).audit;
            if (auditContext && before) {
                await auditService.logEvent(auditContext, {
                    targetType: 'PRODUCT' as any,
                    targetId: id,
                    action: 'PRODUCT_DELETED' as any, // or PERMANENT_DELETE if we had it
                    summary: `Produto excluído PERMANENTEMENTE: ${before.name}`,
                    before
                });
            }

            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Erro ao excluir permanentemente' });
        }
    }
};
