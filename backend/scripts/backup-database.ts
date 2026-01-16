/**
 * 🔐 SCRIPT DE BACKUP DO BANCO DE DADOS
 * 
 * Este script exporta todos os dados do banco para arquivos JSON.
 * Execute ANTES de qualquer operação de migração/alteração de schema.
 * 
 * Uso: npx ts-node scripts/backup-database.ts
 */

import prisma from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

    console.log('🔐 Iniciando backup do banco de dados...');
    console.log(`📁 Destino: ${backupPath}`);

    // Criar diretório de backup
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    fs.mkdirSync(backupPath, { recursive: true });

    try {
        // Backup de cada tabela
        const tables = [
            { name: 'users', query: () => prisma.user.findMany() },
            { name: 'customers', query: () => prisma.customer.findMany() },
            { name: 'pets', query: () => prisma.pet.findMany() },
            { name: 'quotes', query: () => prisma.quote.findMany({ include: { items: true } }) },
            { name: 'appointments', query: () => prisma.appointment.findMany() },
            { name: 'services', query: () => prisma.service.findMany() },
            { name: 'invoices', query: () => prisma.invoice.findMany() },
            { name: 'notifications', query: () => prisma.notification.findMany() },
            { name: 'rolePermissions', query: () => prisma.rolePermission.findMany() },
            { name: 'posts', query: () => prisma.post.findMany() },
            { name: 'staffProfiles', query: () => prisma.staffProfile.findMany() },
        ];

        let totalRecords = 0;

        for (const table of tables) {
            try {
                const data = await table.query();
                const filePath = path.join(backupPath, `${table.name}.json`);
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`  ✅ ${table.name}: ${data.length} registros`);
                totalRecords += data.length;
            } catch (error: any) {
                console.log(`  ⚠️ ${table.name}: Erro - ${error.message}`);
            }
        }

        // Criar arquivo de metadados
        const metadata = {
            timestamp: new Date().toISOString(),
            totalRecords,
            tables: tables.map(t => t.name)
        };
        fs.writeFileSync(path.join(backupPath, 'metadata.json'), JSON.stringify(metadata, null, 2));

        console.log('\n✅ Backup concluído com sucesso!');
        console.log(`📊 Total de registros: ${totalRecords}`);
        console.log(`📁 Local: ${backupPath}`);

        // Listar backups existentes
        const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup-'));
        console.log(`\n📚 Backups disponíveis: ${backups.length}`);

    } catch (error) {
        console.error('❌ Erro no backup:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

backupDatabase();
