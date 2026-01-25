import prisma from '../lib/prisma';

/**
 * Script para:
 * 1. Limpar serviços antigos (não padronizados)
 * 2. Adicionar produtos padrão ao catálogo
 */

async function cleanupAndAddProducts() {
    console.log('🧹 Iniciando limpeza e adição de produtos...');

    // =============================
    // PARTE 1: Limpar serviços antigos
    // =============================

    // Lista de nomes padronizados (que queremos manter)
    const standardPatterns = [
        // Banhos padronizados
        /^Banho (PP|P|M|G|GG|XG) (Curto|Medio|Longo)$/,
        /^Banho Máscara (PP|P|M|G|GG|XG) (Curto|Medio|Longo)$/,
        /^Banho Med\. Cliente (PP|P|M|G|GG|XG) (Curto|Medio|Longo)$/,
        /^Banho Med\. 7Pet (PP|P|M|G|GG|XG) (Curto|Medio|Longo)$/,
        /^Banho Gato (P|M|G) (Curto|Medio|Longo)$/,
        // Tosas padronizadas
        /^Tosa Higiênica (PP|P|M|G|GG|XG)$/,
        /^Tosa Estética (PP|P|M|G|GG|XG)$/,
        /^Tosa Raça (PP|P|M|G|GG|XG)$/,
        /^Tosa Bebê (PP|P|M|G|GG|XG)$/,
        /^Tosa Higiênica Gato (P|M|G)$/,
        /^Tosa Leão Gato (P|M|G)$/,
        // Extras
        /^Corte de Unha/,
        /^Limpeza de Ouvido/,
        /^Escovação de Dentes/,
        /^Hidratação/,
        /^Desembaraço/,
        /^Perfume Premium/,
        /^Laço\/Bandana/
    ];

    const allServices = await prisma.service.findMany();
    console.log(`📋 Total de serviços no banco: ${allServices.length}`);

    let deleted = 0;
    for (const svc of allServices) {
        const isStandard = standardPatterns.some(pattern => pattern.test(svc.name));
        if (!isStandard) {
            console.log(`🗑️ Deletando: ${svc.name}`);
            await prisma.service.delete({ where: { id: svc.id } });
            deleted++;
        }
    }
    console.log(`✅ ${deleted} serviços antigos removidos`);

    // =============================
    // PARTE 2: Adicionar produtos
    // =============================

    interface ProductDef {
        name: string;
        category: string;
        price: number;
        stock: number;
    }

    const products: ProductDef[] = [
        // Higiene
        { name: 'Shampoo Neutro 500ml', category: 'Higiene', price: 35, stock: 20 },
        { name: 'Shampoo Pelos Claros 500ml', category: 'Higiene', price: 42, stock: 15 },
        { name: 'Shampoo Pelos Escuros 500ml', category: 'Higiene', price: 42, stock: 15 },
        { name: 'Shampoo Antipulgas 500ml', category: 'Higiene', price: 48, stock: 10 },
        { name: 'Condicionador Hidratante 500ml', category: 'Higiene', price: 38, stock: 15 },
        { name: 'Perfume Pet Lavanda 100ml', category: 'Higiene', price: 25, stock: 25 },
        { name: 'Perfume Pet Talco 100ml', category: 'Higiene', price: 25, stock: 25 },
        { name: 'Colônia Macho 100ml', category: 'Higiene', price: 28, stock: 20 },
        { name: 'Colônia Fêmea 100ml', category: 'Higiene', price: 28, stock: 20 },
        { name: 'Lenço Umedecido Pet (50un)', category: 'Higiene', price: 22, stock: 30 },

        // Acessórios
        { name: 'Laço Rosa Pequeno', category: 'Acessórios', price: 5, stock: 50 },
        { name: 'Laço Azul Pequeno', category: 'Acessórios', price: 5, stock: 50 },
        { name: 'Laço Vermelho Pequeno', category: 'Acessórios', price: 5, stock: 50 },
        { name: 'Bandana P', category: 'Acessórios', price: 12, stock: 30 },
        { name: 'Bandana M', category: 'Acessórios', price: 15, stock: 30 },
        { name: 'Bandana G', category: 'Acessórios', price: 18, stock: 20 },
        { name: 'Gravata Pet P', category: 'Acessórios', price: 15, stock: 20 },
        { name: 'Gravata Pet M', category: 'Acessórios', price: 18, stock: 20 },
        { name: 'Coleira Nylon P', category: 'Acessórios', price: 25, stock: 15 },
        { name: 'Coleira Nylon M', category: 'Acessórios', price: 30, stock: 15 },
        { name: 'Coleira Nylon G', category: 'Acessórios', price: 35, stock: 10 },
        { name: 'Guia Retrátil 5m', category: 'Acessórios', price: 65, stock: 10 },

        // Alimentação
        { name: 'Ração Premium Cães Adulto 1kg', category: 'Alimentação', price: 45, stock: 20 },
        { name: 'Ração Premium Cães Filhote 1kg', category: 'Alimentação', price: 48, stock: 15 },
        { name: 'Ração Premium Gatos Adulto 1kg', category: 'Alimentação', price: 52, stock: 15 },
        { name: 'Petisco Ossinho Nó P (10un)', category: 'Alimentação', price: 18, stock: 30 },
        { name: 'Petisco Ossinho Nó M (5un)', category: 'Alimentação', price: 22, stock: 25 },
        { name: 'Bifinhos Frango 250g', category: 'Alimentação', price: 28, stock: 20 },
        { name: 'Bifinhos Carne 250g', category: 'Alimentação', price: 28, stock: 20 },

        // Brinquedos
        { name: 'Bolinha Tênis (3un)', category: 'Brinquedos', price: 15, stock: 40 },
        { name: 'Bolinha Borracha c/ Som', category: 'Brinquedos', price: 18, stock: 30 },
        { name: 'Mordedor Corda P', category: 'Brinquedos', price: 22, stock: 25 },
        { name: 'Mordedor Corda M', category: 'Brinquedos', price: 28, stock: 20 },
        { name: 'Mordedor Borracha', category: 'Brinquedos', price: 25, stock: 25 },
        { name: 'Ossinho Nylon G', category: 'Brinquedos', price: 35, stock: 15 },
        { name: 'Pelúcia Patinho', category: 'Brinquedos', price: 32, stock: 20 },
        { name: 'Pelúcia Ursinho', category: 'Brinquedos', price: 32, stock: 20 },
        { name: 'Varinha c/ Pena (Gatos)', category: 'Brinquedos', price: 18, stock: 25 },
        { name: 'Ratinho Pelúcia (Gatos)', category: 'Brinquedos', price: 12, stock: 35 },

        // Saúde
        { name: 'Antipulgas Pipeta P', category: 'Saúde', price: 45, stock: 20 },
        { name: 'Antipulgas Pipeta M', category: 'Saúde', price: 55, stock: 15 },
        { name: 'Antipulgas Pipeta G', category: 'Saúde', price: 65, stock: 10 },
        { name: 'Vermífugo Comprimido (4un)', category: 'Saúde', price: 38, stock: 20 },
        { name: 'Spray Cicatrizante 100ml', category: 'Saúde', price: 42, stock: 15 },
        { name: 'Limpa Orelhas 100ml', category: 'Saúde', price: 28, stock: 25 },
        { name: 'Limpa Lágrimas 100ml', category: 'Saúde', price: 25, stock: 25 },

        // Camas e Conforto
        { name: 'Cama Pet P (45x35cm)', category: 'Camas', price: 85, stock: 8 },
        { name: 'Cama Pet M (60x50cm)', category: 'Camas', price: 120, stock: 6 },
        { name: 'Cama Pet G (80x70cm)', category: 'Camas', price: 180, stock: 4 },
        { name: 'Cobertor Pet P', category: 'Camas', price: 35, stock: 15 },
        { name: 'Cobertor Pet M', category: 'Camas', price: 45, stock: 12 },
        { name: 'Almofada Térmica', category: 'Camas', price: 55, stock: 10 },
    ];

    let productsCreated = 0;
    let productsSkipped = 0;

    for (const prod of products) {
        const existing = await prisma.product.findFirst({ where: { name: prod.name } });
        if (!existing) {
            await prisma.product.create({
                data: {
                    name: prod.name,
                    category: prod.category,
                    price: prod.price,
                    stock: prod.stock,
                    description: prod.name
                }
            });
            productsCreated++;
        } else {
            productsSkipped++;
        }
    }

    console.log(`📦 Produtos: ${productsCreated} criados, ${productsSkipped} já existiam`);
    console.log('🎉 Limpeza e adição concluídas!');
}

cleanupAndAddProducts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
