/**
 * 📊 SCRIPT DE VERIFICAÇÃO DO BANCO DE DADOS
 * 
 * Este script conta registros em todas as tabelas principais.
 * Use para verificar se houve perda de dados.
 * 
 * Uso: npx ts-node scripts/check-db-counts.ts
 */

import prisma from '../src/lib/prisma';

async function checkDatabaseCounts() {
    console.log('📊 Verificando contagem de registros no banco de dados...\n');

    try {
        const counts = {
            users: await prisma.user.count(),
            customers: await prisma.customer.count(),
            pets: await prisma.pet.count(),
            quotes: await prisma.quote.count(),
            quoteItems: await prisma.quoteItem.count(),
            appointments: await prisma.appointment.count(),
            services: await prisma.service.count(),
            invoices: await prisma.invoice.count(),
            notifications: await prisma.notification.count(),
            posts: await prisma.post.count(),
            auditEvents: await prisma.auditEvent.count(),
        };

        console.log('='.repeat(40));
        console.log('       CONTAGEM DE REGISTROS');
        console.log('='.repeat(40));

        let total = 0;
        for (const [table, count] of Object.entries(counts)) {
            const status = count === 0 ? '⚠️' : '✅';
            console.log(`${status} ${table.padEnd(20)} ${count}`);
            total += count;
        }

        console.log('='.repeat(40));
        console.log(`   TOTAL: ${total} registros`);
        console.log('='.repeat(40));

        if (total === 0) {
            console.log('\n🚨 ALERTA: Banco de dados está VAZIO!');
            console.log('   Pode ter ocorrido perda de dados.');
            console.log('   Verifique os backups em /backups/');
        } else if (counts.users === 0 || counts.customers === 0) {
            console.log('\n⚠️ AVISO: Tabelas críticas estão vazias!');
        } else {
            console.log('\n✅ Banco de dados parece estar saudável.');
        }

    } catch (error) {
        console.error('❌ Erro ao verificar banco:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabaseCounts();
