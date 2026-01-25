import { PrismaClient, ServicePriceConfig } from '../generated';
import prisma from '../lib/prisma';

/**
 * Service para gerenciar configurações de preços de serviços
 * Substitui valores hardcodados no controller
 */

export class ServicePriceConfigService {
    /**
     * Obtém configuração de preço por serviço
     */
    static async getServicePrice(serviceName: string): Promise<number | null> {
        const config = await prisma.servicePriceConfig.findFirst({
            where: {
                service: serviceName,
                isActive: true
            }
        });
        return config?.basePrice || null;
    }

    /**
     * Obtém todas as configurações de preços
     */
    static async getAllConfigs(): Promise<ServicePriceConfig[]> {
        return await prisma.servicePriceConfig.findMany({
            where: { isActive: true },
            orderBy: { service: 'asc' }
        });
    }

    /**
     * Atualiza configuração de preço
     */
    static async updateServicePrice(
        serviceName: string,
        basePrice: number,
        description?: string
    ): Promise<ServicePriceConfig> {
        return await prisma.servicePriceConfig.upsert({
            where: { service: serviceName },
            update: {
                basePrice,
                description,
                updatedAt: new Date()
            },
            create: {
                service: serviceName,
                basePrice,
                description,
                category: 'GENERAL_SERVICE',
                isActive: true
            }
        });
    }

    /**
     * Obtém preços de desembolo por região
     */
    static async getKnotRemovalPrices(): Promise<Record<string, number>> {
        const knotConfigs = await prisma.servicePriceConfig.findMany({
            where: {
                category: 'KNOT_REMOVAL',
                isActive: true
            }
        });

        const prices: Record<string, number> = {};
        knotConfigs.forEach(config => {
            prices[config.service.toLowerCase()] = config.basePrice;
        });

        return prices;
    }

    /**
     * Inicializa configurações padrão se não existirem
     */
    static async initializeDefaultConfigs(): Promise<void> {
        const existingCount = await prisma.servicePriceConfig.count();

        if (existingCount > 0) {
            console.log('[ServicePriceConfig] Configurations already exist, skipping initialization');
            return;
        }

        console.log('[ServicePriceConfig] Initializing default configurations...');

        // Preços de desembolo padrão
        const knotPrices = [
            { service: 'orelhas', basePrice: 7.50, description: 'Desembolo - Orelhas' },
            { service: 'rostinho', basePrice: 15.00, description: 'Desembolo - Rostinho' },
            { service: 'pescoço', basePrice: 15.00, description: 'Desembolo - Pescoço' },
            { service: 'barriga', basePrice: 12.50, description: 'Desembolo - Barriga' },
            { service: 'pata frontal esquerda', basePrice: 7.50, description: 'Desembolo - Pata frontal esquerda' },
            { service: 'pata frontal direita', basePrice: 7.50, description: 'Desembolo - Pata frontal direita' },
            { service: 'pata traseira esquerda', basePrice: 7.50, description: 'Desembolo - Pata traseira esquerda' },
            { service: 'pata traseira direita', basePrice: 7.50, description: 'Desembolo - Pata traseira direita' },
            { service: 'bumbum', basePrice: 12.50, description: 'Desembolo - Bumbum' },
            { service: 'rabo', basePrice: 10.00, description: 'Desembolo - Rabo' }
        ];

        // Outros serviços
        const otherServices = [
            { service: 'banho_medicamentoso_antipulgas', basePrice: 45.00, description: 'Banho Medicamentoso Antipulgas', category: 'MEDICATED_BATH' as const },
            { service: 'desembolo_patas_grupo', basePrice: 7.50, description: 'Desembolo - Patas (grupo)', category: 'KNOT_REMOVAL' as const }
        ];

        const allConfigs = [
            ...knotPrices.map(kp => ({ ...kp, category: 'KNOT_REMOVAL' as const })),
            ...otherServices
        ];

        await prisma.servicePriceConfig.createMany({
            data: allConfigs
        });

        console.log(`[ServicePriceConfig] Created ${allConfigs.length} default configurations`);
    }

    /**
     * Obtém preço específico de banho medicamentoso
     */
    static async getMedicatedBathPrice(): Promise<number> {
        const price = await this.getServicePrice('banho_medicamentoso_antipulgas');
        return price || 45.00; // Default fallback
    }

    /**
     * Obtém preço padrão para desembolo de patas
     */
    static async getDefaultPawKnotPrice(): Promise<number> {
        const price = await this.getServicePrice('desembolo_patas_grupo');
        return price || 7.50; // Default fallback
    }
}