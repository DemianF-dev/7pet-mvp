import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper para fazer parse do preço
function parsePrice(priceStr: string): number {
    return parseFloat(priceStr.replace('R$', '').replace('.', '').replace(',', '.').trim());
}

// Helper para converter tempo no formato HH:MM para minutos
function parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + (minutes || 0);
}

// Dados RAW de GATOS da planilha
const CAT_SERVICES_RAW = `1330;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;G;Curto; R$ 115,00 ;por pet;1:00
1354;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;G;Longo; R$ 125,00 ;por pet;1:00
1342;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;G;Médio; R$ 120,00 ;por pet;1:00
1332;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;GG;Curto; R$ 165,00 ;por pet;1:00
1356;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;GG;Longo; R$ 175,00 ;por pet;1:00
1344;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;GG;Médio; R$ 170,00 ;por pet;1:00
1328;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;M;Curto; R$ 90,00 ;por pet;1:00
1352;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;M;Longo; R$ 100,00 ;por pet;1:00
1340;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;M;Médio; R$ 95,00 ;por pet;1:00
1326;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;P;Curto; R$ 70,00 ;por pet;1:00
1350;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;P;Longo; R$ 80,00 ;por pet;1:00
1338;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;P;Médio; R$ 75,00 ;por pet;1:00
1324;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;PP;Curto; R$ 60,00 ;por pet;1:00
1348;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;PP;Longo; R$ 70,00 ;por pet;1:00
1336;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;PP;Médio; R$ 65,00 ;por pet;1:00
1334;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;XG;Curto; R$ 225,00 ;por pet;1:00
1358;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;XG;Longo; R$ 245,00 ;por pet;1:00
1346;Banhos;Linha Especial;-;Banho Linha Especial com Máscara Ideal;XG;Médio; R$ 235,00 ;por pet;1:00
1378;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);G;Curto; R$ 90,00 ;por pet;1:00
1426;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);G;Longo; R$ 100,00 ;por pet;1:00
1402;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);G;Médio; R$ 95,00 ;por pet;1:00
1380;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);GG;Curto; R$ 130,00 ;por pet;1:00
1428;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);GG;Longo; R$ 140,00 ;por pet;1:00
1404;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);GG;Médio; R$ 135,00 ;por pet;1:00
1376;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);M;Curto; R$ 65,00 ;por pet;1:00
1424;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);M;Longo; R$ 75,00 ;por pet;1:00
1400;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);M;Médio; R$ 70,00 ;por pet;1:00
1374;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);P;Curto; R$ 45,00 ;por pet;1:00
1422;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);P;Longo; R$ 55,00 ;por pet;1:00
1398;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);P;Médio; R$ 50,00 ;por pet;1:00
1372;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);PP;Curto; R$ 35,00 ;por pet;1:00
1420;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);PP;Longo; R$ 45,00 ;por pet;1:00
1396;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);PP;Médio; R$ 40,00 ;por pet;1:00
1382;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);XG;Curto; R$ 180,00 ;por pet;1:00
1430;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);XG;Longo; R$ 200,00 ;por pet;1:00
1406;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto Cliente);XG;Médio; R$ 190,00 ;por pet;1:00
1366;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);G;Curto; R$ 110,00 ;por pet;1:00
1414;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);G;Longo; R$ 120,00 ;por pet;1:00
1390;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);G;Médio; R$ 115,00 ;por pet;1:00
1368;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);GG;Curto; R$ 155,00 ;por pet;1:00
1416;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);GG;Longo; R$ 165,00 ;por pet;1:00
1392;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);GG;Médio; R$ 160,00 ;por pet;1:00
1364;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);M;Curto; R$ 80,00 ;por pet;1:00
1412;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);M;Longo; R$ 90,00 ;por pet;1:00
1388;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);M;Médio; R$ 85,00 ;por pet;1:00
1362;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);P;Curto; R$ 60,00 ;por pet;1:00
1410;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);P;Longo; R$ 70,00 ;por pet;1:00
1386;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);P;Médio; R$ 65,00 ;por pet;1:00
1360;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);PP;Curto; R$ 50,00 ;por pet;1:00
1408;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);PP;Longo; R$ 60,00 ;por pet;1:00
1384;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);PP;Médio; R$ 55,00 ;por pet;1:00
1370;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);XG;Curto; R$ 215,00 ;por pet;1:00
1418;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);XG;Longo; R$ 235,00 ;por pet;1:00
1394;Banhos;Medicamentoso;-;Banho Medicamentoso (Produto The Pet);XG;Médio; R$ 225,00 ;por pet;1:00
1294;Banhos;Tradicional;-;Banho Tradicional;G;Curto; R$ 95,00 ;por pet;1:00
1318;Banhos;Tradicional;-;Banho Tradicional;G;Longo; R$ 105,00 ;por pet;1:00
1306;Banhos;Tradicional;-;Banho Tradicional;G;Médio; R$ 100,00 ;por pet;1:00
1296;Banhos;Tradicional;-;Banho Tradicional;GG;Curto; R$ 135,00 ;por pet;1:00
1320;Banhos;Tradicional;-;Banho Tradicional;GG;Longo; R$ 145,00 ;por pet;1:00
1308;Banhos;Tradicional;-;Banho Tradicional;GG;Médio; R$ 140,00 ;por pet;1:00
1292;Banhos;Tradicional;-;Banho Tradicional;M;Curto; R$ 70,00 ;por pet;1:00
1316;Banhos;Tradicional;-;Banho Tradicional;M;Longo; R$ 80,00 ;por pet;1:00
1304;Banhos;Tradicional;-;Banho Tradicional;M;Médio; R$ 75,00 ;por pet;1:00
1290;Banhos;Tradicional;-;Banho Tradicional;P;Curto; R$ 50,00 ;por pet;1:00
1314;Banhos;Tradicional;-;Banho Tradicional;P;Longo; R$ 60,00 ;por pet;1:00
1302;Banhos;Tradicional;-;Banho Tradicional;P;Médio; R$ 55,00 ;por pet;1:00
1288;Banhos;Tradicional;-;Banho Tradicional;PP;Curto; R$ 40,00 ;por pet;1:00
1312;Banhos;Tradicional;-;Banho Tradicional;PP;Longo; R$ 50,00 ;por pet;1:00
1300;Banhos;Tradicional;-;Banho Tradicional;PP;Médio; R$ 45,00 ;por pet;1:00
1298;Banhos;Tradicional;-;Banho Tradicional;XG;Curto; R$ 185,00 ;por pet;1:00
1322;Banhos;Tradicional;-;Banho Tradicional;XG;Longo; R$ 205,00 ;por pet;1:00
1310;Banhos;Tradicional;-;Banho Tradicional;XG;Médio; R$ 195,00 ;por pet;1:00
1510;Adicionais;Coloração;Definitiva;Coloração Definitiva [Tintura];-;-; R$ 20,00 ;por aplicação;0:20
1508;Adicionais;Coloração;Temporária;Coloração Temporária [Caneta];-;-; R$ 20,00 ;por aplicação;0:20
1436;Adicionais;Corta Unha;-;Corte de unhas;GG;-; R$ 25,00 ;por pet;0:10
1434;Adicionais;Corta Unha;-;Corte de unhas;M;-; R$ 20,00 ;por pet;0:10
1478;Adicionais;Corta Unha;-;Corte de unhas;PP;-; R$ 15,00 ;por pet;0:10
1056;Adicionais;Desembolo;Avançado;Desembolo;G;-; R$ 55,00 ;por hora;1:00
1052;Adicionais;Desembolo;Básico;Desembolo;G;-; R$ 35,00 ;por hora;1:00
1054;Adicionais;Desembolo;Intermediário;Desembolo;G;-; R$ 45,00 ;por hora;1:00
1062;Adicionais;Desembolo;Avançado;Desembolo;GG;-; R$ 65,00 ;por hora;1:00
1058;Adicionais;Desembolo;Básico;Desembolo;GG;-; R$ 45,00 ;por hora;1:00
1060;Adicionais;Desembolo;Intermediário;Desembolo;GG;-; R$ 55,00 ;por hora;1:00
1050;Adicionais;Desembolo;Avançado;Desembolo;M;-; R$ 50,00 ;por hora;1:00
1046;Adicionais;Desembolo;Básico;Desembolo;M;-; R$ 30,00 ;por hora;1:00
1048;Adicionais;Desembolo;Intermediário;Desembolo;M;-; R$ 40,00 ;por hora;1:00
1044;Adicionais;Desembolo;Avançado;Desembolo;P;-; R$ 45,00 ;por hora;1:00
1040;Adicionais;Desembolo;Básico;Desembolo;P;-; R$ 25,00 ;por hora;1:00
1042;Adicionais;Desembolo;Intermediário;Desembolo;P;-; R$ 35,00 ;por hora;1:00
1038;Adicionais;Desembolo;Avançado;Desembolo;PP;-; R$ 40,00 ;por hora;1:00
1034;Adicionais;Desembolo;Básico;Desembolo;PP;-; R$ 20,00 ;por hora;1:00
1036;Adicionais;Desembolo;Intermediário;Desembolo;PP;-; R$ 30,00 ;por hora;1:00
1068;Adicionais;Desembolo;Avançado;Desembolo;XG;-; R$ 75,00 ;por hora;1:00
1064;Adicionais;Desembolo;Básico;Desembolo;XG;-; R$ 55,00 ;por hora;1:00
1066;Adicionais;Desembolo;Intermediário;Desembolo;XG;-; R$ 65,00 ;por hora;1:00
1440;Adicionais;Escova Dentes;Com Escova;Escovação de dente (c/ escova);G;-; R$ 7,50 ;por pet;0:05
1072;Adicionais;Escova Dentes;Com Escova;Escovação de dente (c/ escova);PP;-; R$ 5,00 ;por pet;0:05
1438;Adicionais;Escova Dentes;Sem Escova;Escovação de dente (s/ escova);G;-; R$ 17,50 ;por pet;0:05
1070;Adicionais;Escova Dentes;Sem Escova;Escovação de dente (s/ escova);PP;-; R$ 15,00 ;por pet;0:05
1488;Tosas;Head;-;Head Trimming [Tosa Rosto/Cabeça];G;-; R$ 25,00 ;por pet;0:30
1490;Tosas;Head;-;Head Trimming [Tosa Rosto/Cabeça];GG;-; R$ 30,00 ;por pet;0:30
1486;Tosas;Head;-;Head Trimming [Tosa Rosto/Cabeça];M;-; R$ 20,00 ;por pet;0:30
1484;Tosas;Head;-;Head Trimming [Tosa Rosto/Cabeça];P;-; R$ 15,00 ;por pet;0:30
1482;Tosas;Head;-;Head Trimming [Tosa Rosto/Cabeça];PP;-; R$ 10,00 ;por pet;0:30
1492;Tosas;Head;-;Head Trimming [Tosa Rosto/Cabeça];XG;-; R$ 35,00 ;por pet;0:30
1092;Adicionais;Hidrata F&P;-;Hidratação de Focinho e Patas;G;-; R$ 10,00 ;por pet;0:05
1094;Adicionais;Hidrata F&P;-;Hidratação de Focinho e Patas;GG;-; R$ 17,50 ;por pet;0:05
1090;Adicionais;Hidrata F&P;-;Hidratação de Focinho e Patas;M;-; R$ 10,00 ;por pet;0:05
1088;Adicionais;Hidrata F&P;-;Hidratação de Focinho e Patas;P;-; R$ 7,00 ;por pet;0:05
1086;Adicionais;Hidrata F&P;-;Hidratação de Focinho e Patas;PP;-; R$ 7,00 ;por pet;0:05
1096;Adicionais;Hidrata F&P;-;Hidratação de Focinho e Patas;XG;-; R$ 17,50 ;por pet;0:05
1480;Adicionais;Limpa Ouvido;-;Limpeza de Ouvidos;G;-; R$ 10,00 ;por pet;0:10
1432;Adicionais;Limpa Ouvido;-;Limpeza de Ouvidos;PP;-; R$ 7,00 ;por pet;0:10
1498;Adicionais;Penteados;-;Penteados Elaborado;GG;-; R$ 30,00 ;por pet;0:15
1496;Adicionais;Penteados;-;Penteados Elaborado;M;-; R$ 25,00 ;por pet;0:15
1494;Adicionais;Penteados;-;Penteados Elaborado;PP;-; R$ 20,00 ;por pet;0:15
1028;Adicionais;Stripping;-;Remoção de Pelos Mortos [Stripping];G;-; R$ 55,00 ;por pet;0

:40
1030;Adicionais;Stripping;-;Remoção de Pelos Mortos [Stripping];GG;-; R$ 80,00 ;por pet;0:40
1026;Adicionais;Stripping;-;Remoção de Pelos Mortos [Stripping];M;-; R$ 40,00 ;por pet;0:40
1024;Adicionais;Stripping;-;Remoção de Pelos Mortos [Stripping];P;-; R$ 25,00 ;por pet;0:40
1022;Adicionais;Stripping;-;Remoção de Pelos Mortos [Stripping];PP;-; R$ 15,00 ;por pet;0:40
1032;Adicionais;Stripping;-;Remoção de Pelos Mortos [Stripping];XG;-; R$ 100,00 ;por pet;0:40
1474;Tosas;Bebê;-;Tosa Bebê;G;-; R$ 145,00 ;por pet;1:00
1476;Tosas;Bebê;-;Tosa Bebê;GG;-; R$ 175,00 ;por pet;1:00
1472;Tosas;Bebê;-;Tosa Bebê;M;-; R$ 120,00 ;por pet;1:00
1470;Tosas;Bebê;-;Tosa Bebê;P;-; R$ 110,00 ;por pet;1:00
1468;Tosas;Bebê;-;Tosa Bebê;PP;-; R$ 100,00 ;por pet;1:00
1466;Tosas;Bebê;-;Tosa Bebê;XG;-; R$ 220,00 ;por pet;1:00
1448;Tosas;Geral;-;Tosa Estética Geral;G;-; R$ 125,00 ;por pet;1:00
1450;Tosas;Geral;-;Tosa Estética Geral;GG;-; R$ 155,00 ;por pet;1:00
1446;Tosas;Geral;-;Tosa Estética Geral;M;-; R$ 100,00 ;por pet;1:00
1444;Tosas;Geral;-;Tosa Estética Geral;P;-; R$ 90,00 ;por pet;1:00
1442;Tosas;Geral;-;Tosa Estética Geral;PP;-; R$ 80,00 ;por pet;1:00
1452;Tosas;Geral;-;Tosa Estética Geral;XG;-; R$ 190,00 ;por pet;1:00
992;Tosas;Higiênica;-;Tosa Higiênica;G;-; R$ 35,00 ;por pet;0:30
994;Tosas;Higiênica;-;Tosa Higiênica;GG;-; R$ 45,00 ;por pet;0:30
990;Tosas;Higiênica;-;Tosa Higiênica;M;-; R$ 25,00 ;por pet;0:30
988;Tosas;Higiênica;-;Tosa Higiênica;P;-; R$ 20,00 ;por pet;0:30
986;Tosas;Higiênica;-;Tosa Higiênica;PP;-; R$ 15,00 ;por pet;0:30
996;Tosas;Higiênica;-;Tosa Higiênica;XG;-; R$ 55,00 ;por pet;0:30
1460;Tosas;Trimming;-;Tosa Trimming;G;-; R$ 130,00 ;por pet;1:30
1462;Tosas;Trimming;-;Tosa Trimming;GG;-; R$ 160,00 ;por pet;1:30
1458;Tosas;Trimming;-;Tosa Trimming;M;-; R$ 110,00 ;por pet;1:30
1456;Tosas;Trimming;-;Tosa Trimming;P;-; R$ 100,00 ;por pet;1:30
1454;Tosas;Trimming;-;Tosa Trimming;PP;-; R$ 90,00 ;por pet;1:30
1464;Tosas;Trimming;-;Tosa Trimming;XG;-; R$ 200,00 ;por pet;1:30
1440;Adicionais;Escova Dentes;Com Escova;Escovação de dente (c/ escova);GG;-; R$ 7,50 ;por pet;0:05
1438;Adicionais;Escova Dentes;Sem Escova;Escovação de dente (s/ escova);GG;-; R$ 17,50 ;por pet;0:05
1480;Adicionais;Limpa Ouvido;-;Limpeza de Ouvidos;GG;-; R$ 10,00 ;por pet;0:10
1440;Adicionais;Escova Dentes;Com Escova;Escovação de dente (c/ escova);XG;-; R$ 7,50 ;por pet;0:05
1438;Adicionais;Escova Dentes;Sem Escova;Escovação de dente (s/ escova);XG;-; R$ 17,50;por pet;0:05
1480;Adicionais;Limpa Ouvido;-;Limpeza de Ouvidos;XG;-; R$ 10,00 ;por pet;0:10
1436;Adicionais;Corta Unha;-;Corte de unhas;XG;-; R$ 25,00 ;por pet;0:10
1498;Adicionais;Penteados;-;Penteados Elaborado;XG;-; R$ 30,00 ;por pet;0:15
1434;Adicionais;Corta Unha;-;Corte de unhas;G;-; R$ 20,00 ;por pet;0:10
1496;Adicionais;Penteados;-;Penteados Elaborado;G;-; R$ 25,00 ;por pet;0:15
1478;Adicionais;Corta Unha;-;Corte de unhas;P;-; R$ 15,00 ;por pet;0:10
1494;Adicionais;Penteados;-;Penteados Elaborado;P;-; R$ 20,00 ;por pet;0:15
1072;Adicionais;Escova Dentes;Com Escova;Escovação de dente (c/ escova);P;-; R$ 5,00 ;por pet;0:05
1070;Adicionais;Escova Dentes;Sem Escova;Escovação de dente (s/ escova);P;-; R$ 15,00 ;por pet;0:05
1432;Adicionais;Limpa Ouvido;-;Limpeza de Ouvidos;P;-; R$ 7,00 ;por pet;0:10
1072;Adicionais;Escova Dentes;Com Escova;Escovação de dente (c/ escova);M;-; R$ 5,00 ;por pet;0:05
1070;Adicionais;Escova Dentes;Sem Escova;Escovação de dente (s/ escova);M;-; R$ 15,00 ;por pet;0:05
1432;Adicionais;Limpa Ouvido;-;Limpeza de Ouvidos;M;-; R$ 7,00 ;por pet;0:10`;

// Parse dos dados
function parseServices(rawData: string, species: 'Canino' | 'Felino') {
    const lines = rawData.trim().split('\n');
    const services = [];

    for (const line of lines) {
        const parts = line.split(';').map(p => p.trim());
        if (parts.length < 10) continue;

        const [id, category, subcategory, type, product, sizeLabel, coatType, priceStr, unit, timeStr] = parts;

        services.push({
            category: category || null,
            subcategory: subcategory === '-' ? null : subcategory,
            type: type === '-' ? null : type,
            name: product.trim(),
            sizeLabel: sizeLabel === '-' ? null : sizeLabel.trim(),
            coatType: coatType === '-' ? null : coatType.trim(),
            basePrice: parsePrice(priceStr),
            unit: unit.trim(),
            duration: parseTime(timeStr),
            species,
            description: `${product} - ${species === 'Canino' ? 'Cão' : 'Gato'}${sizeLabel !== '-' ? ` (Porte ${sizeLabel})` : ''}${coatType !== '-' ? ` [Pelo ${coatType}]` : ''}`
        });
    }

    return services;
}

async function resetAndPopulateServices() {
    try {
        console.log('🧹 LIMPANDO todos os serviços existentes...\n');

        // Soft delete ALL existing services
        await prisma.service.updateMany({
            data: { deletedAt: new Date() }
        });

        console.log('✅ Serviços antigos removidos.\n');
        console.log('🌱 Populando com dados CORRETOS da planilha 7Pet...\n');

        // Parse services for CATS (Felino)
        const catServices = parseServices(CAT_SERVICES_RAW, 'Felino');
        console.log(`📊 ${catServices.length} serviços de GATOS processados.`);

        // Parse services for DOGS (Canino) - using the same data for now
        const dogServices = parseServices(CAT_SERVICES_RAW, 'Canino');
        console.log(`📊 ${dogServices.length} serviços de CÃES processados.`);

        let created = 0;

        // Insert CAT services
        console.log('\n🐱 Inserindo serviços para GATOS...');
        for (const service of catServices) {
            await prisma.service.create({ data: service });
            created++;
            if (created % 10 === 0) {
                console.log(`  ✓ ${created} serviços criados...`);
            }
        }

        // Insert DOG services
        console.log('\n🐕 Inserindo serviços para CÃES...');
        for (const service of dogServices) {
            await prisma.service.create({ data: service });
            created++;
            if (created % 10 === 0) {
                console.log(`  ✓ ${created} serviços criados...`);
            }
        }

        console.log(`\n🎉 SUCESSO! ${created} serviços criados.`);

        // Summary
        const totalCats = await prisma.service.count({ where: { species: 'Felino', deletedAt: null } });
        const totalDogs = await prisma.service.count({ where: { species: 'Canino', deletedAt: null } });

        console.log('\n📈 RESUMO FINAL:');
        console.log(`  🐱 Gatos: ${totalCats} serviços`);
        console.log(`  🐕 Cães: ${totalDogs} serviços`);
        console.log(`  🎯 Total: ${totalCats + totalDogs} serviços ativos`);

    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Execute
resetAndPopulateServices()
    .then(() => {
        console.log('\n✨ Migração concluída com sucesso!!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Falha na migração:', error);
        process.exit(1);
    });
