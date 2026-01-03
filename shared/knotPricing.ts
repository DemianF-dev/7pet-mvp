// Tabela de preços de desembolos por região
export const KNOT_REMOVAL_PRICES: Record<string, number> = {
    'orelhas': 7.50,
    'rostinho': 15.00,
    'pescoço': 15.00,
    'pescoço': 15.00,
    'barriga': 12.50,
    'pata_frontal_esquerda': 7.50,
    'pata_frontal_direita': 7.50,
    'pata_traseira_esquerda': 7.50,
    'pata_traseira_direita': 7.50,
    'bumbum': 12.50,
    'rabo': 10.00
};

/**
 * Calcula os itens de desembolo baseado nas regiões com nós
 * @param knotRegions - String com regiões separadas por vírgula ou array de regiões
 * @returns Array de itens com descrição, quantidade e preço
 */
export function calculateKnotRemovalItems(knotRegions: string | string[]): Array<{
    description: string;
    quantity: number;
    price: number;
}> {
    if (!knotRegions) return [];

    // Normalizar entrada
    const regions = typeof knotRegions === 'string'
        ? knotRegions.toLowerCase().split(',').map(r => r.trim()).filter(r => r)
        : knotRegions.map(r => r.toLowerCase().trim());

    const items: Array<{ description: string; quantity: number; price: number }> = [];

    // Contar patas
    const patas = regions.filter(r => r.includes('pata'));
    const outraRegioes = regions.filter(r => !r.includes('pata'));

    // Adicionar item para patas (consolidado)
    if (patas.length > 0) {
        items.push({
            description: `Desembolo - Patas (${patas.length}x)`,
            quantity: patas.length,
            price: 7.50
        });
    }

    // Adicionar itens para outras regiões
    outraRegioes.forEach(region => {
        const normalizedRegion = region.replace(/\s+/g, '_');
        const price = KNOT_REMOVAL_PRICES[normalizedRegion];

        if (price) {
            items.push({
                description: `Desembolo - ${region.charAt(0).toUpperCase() + region.slice(1)}`,
                quantity: 1,
                price
            });
        }
    });

    return items;
}

/**
 * Calcula o total de desembolo
 */
export function calculateKnotRemovalTotal(knotRegions: string | string[]): number {
    const items = calculateKnotRemovalItems(knotRegions);
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}
