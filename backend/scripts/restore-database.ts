/**
 * 🔄 SCRIPT DE RESTAURAÇÃO DO BANCO DE DADOS
 * 
 * Este script restaura dados de um backup JSON.
 * 
 * Uso: npx ts-node scripts/restore-database.ts [nome-do-backup]
 */

import prisma from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function restoreDatabase() {
    const backupName = process.argv[2];

    if (!backupName) {
        // Listar backups disponíveis
        console.log('📚 Backups disponíveis:\n');
        const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup-'));
        if (backups.length === 0) {
            console.log('Nenhum backup encontrado.');
            process.exit(1);
        }
        backups.forEach(b => console.log(`  - ${b}`));
        console.log('\nUso: npx ts-node scripts/restore-database.ts [nome-do-backup]');
        process.exit(0);
    }

    const backupPath = path.join(BACKUP_DIR, backupName);

    if (!fs.existsSync(backupPath)) {
        console.error(`❌ Backup não encontrado: ${backupPath}`);
        process.exit(1);
    }

    console.log(`🔄 Restaurando backup: ${backupName}`);
    console.log('⚠️ ATENÇÃO: Isso irá SOBRESCREVER dados existentes!\n');

    try {
        // Restaurar Users primeiro (dependência de outras tabelas)
        const usersFile = path.join(backupPath, 'users.json');
        if (fs.existsSync(usersFile)) {
            const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
            console.log(`  Restaurando ${users.length} usuários...`);
            for (const user of users) {
                await prisma.user.upsert({
                    where: { id: user.id },
                    update: user,
                    create: user
                });
            }
            console.log('  ✅ Usuários restaurados');
        }

        // Restaurar Customers
        const customersFile = path.join(backupPath, 'customers.json');
        if (fs.existsSync(customersFile)) {
            const customers = JSON.parse(fs.readFileSync(customersFile, 'utf-8'));
            console.log(`  Restaurando ${customers.length} clientes...`);
            for (const customer of customers) {
                await prisma.customer.upsert({
                    where: { id: customer.id },
                    update: customer,
                    create: customer
                });
            }
            console.log('  ✅ Clientes restaurados');
        }

        // Restaurar Pets
        const petsFile = path.join(backupPath, 'pets.json');
        if (fs.existsSync(petsFile)) {
            const pets = JSON.parse(fs.readFileSync(petsFile, 'utf-8'));
            console.log(`  Restaurando ${pets.length} pets...`);
            for (const pet of pets) {
                await prisma.pet.upsert({
                    where: { id: pet.id },
                    update: pet,
                    create: pet
                });
            }
            console.log('  ✅ Pets restaurados');
        }

        // Restaurar Services
        const servicesFile = path.join(backupPath, 'services.json');
        if (fs.existsSync(servicesFile)) {
            const services = JSON.parse(fs.readFileSync(servicesFile, 'utf-8'));
            console.log(`  Restaurando ${services.length} serviços...`);
            for (const service of services) {
                await prisma.service.upsert({
                    where: { id: service.id },
                    update: service,
                    create: service
                });
            }
            console.log('  ✅ Serviços restaurados');
        }

        console.log('\n✅ Restauração concluída!');
        console.log('   Execute check-db-counts.ts para verificar.');

    } catch (error) {
        console.error('❌ Erro na restauração:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

restoreDatabase();
