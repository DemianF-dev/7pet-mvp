/**
 * 🔄 DYNAMIC DATABASE RESTORE SCRIPT
 * 
 * This script restores data from JSON backups.
 * It automatically detects files and handles logical order for basic dependencies.
 * 
 * Usage: npx ts-node scripts/restore-database.ts [backup-name]
 */

import prisma from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function restoreDatabase() {
    const backupName = process.argv[2];

    if (!backupName) {
        console.log('📚 Available Backups:\n');
        if (!fs.existsSync(BACKUP_DIR)) {
            console.log('No backups folder found.');
            process.exit(1);
        }
        const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup-'));
        if (backups.length === 0) {
            console.log('No backups found.');
            process.exit(1);
        }
        backups.forEach(b => console.log(`  - ${b}`));
        console.log('\nUsage: npx ts-node scripts/restore-database.ts [backup-name]');
        process.exit(0);
    }

    const backupPath = path.join(BACKUP_DIR, backupName);

    if (!fs.existsSync(backupPath)) {
        console.error(`❌ Backup not found: ${backupPath}`);
        process.exit(1);
    }

    console.log(`🔄 Restoring backup: ${backupName}`);
    console.log('⚠️ WARNING: This will UPSERT data into existing tables!\n');

    try {
        const files = fs.readdirSync(backupPath).filter(f => f.endsWith('.json') && f !== 'metadata.json');

        // Logical ordering for common dependencies
        // Users first, then regular entities
        const priorityOrder = ['users', 'customers', 'pets', 'staffProfiles'];
        const sortedFiles = files.sort((a, b) => {
            const nameA = a.replace('.json', '');
            const nameB = b.replace('.json', '');
            const indexA = priorityOrder.indexOf(nameA);
            const indexB = priorityOrder.indexOf(nameB);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return 0;
        });

        for (const file of sortedFiles) {
            const tableName = file.replace('.json', '');
            const filePath = path.join(backupPath, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            if (!Array.isArray(data) || data.length === 0) {
                console.log(`  ⏭️  ${tableName}: empty or invalid`);
                continue;
            }

            console.log(`  📥 Restoring ${data.length} records to "${tableName}"...`);

            // Note: We use raw queries or upsert logic. 
            // Since this is dynamic, we'll try raw upsert-like logic or clear/insert if safe.
            // For now, let's attempt to use Prisma's dynamic nature if possible or raw insert.

            for (const record of data) {
                const keys = Object.keys(record);
                const values = Object.values(record);

                // Construct basic dynamic upsert using raw query to be model-agnostic
                const columns = keys.map(k => `"${k}"`).join(', ');
                const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                const updates = keys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');

                try {
                    await prisma.$executeRawUnsafe(
                        `INSERT INTO "${tableName}" (${columns}) 
                         VALUES (${placeholders})
                         ON CONFLICT (id) DO UPDATE SET ${updates}`,
                        ...values
                    );
                } catch (e: any) {
                    // Fail gracefully for specific records if keys don't match latest schema
                    console.log(`    ⚠️ Skipping record in ${tableName}: ${e.message.substring(0, 100)}...`);
                }
            }
            console.log(`  ✅ ${tableName} restored.`);
        }

        console.log('\n✅ Restore completed!');

    } catch (error) {
        console.error('❌ Restore failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

restoreDatabase();
