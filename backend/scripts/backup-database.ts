/**
 * 🔐 DYNAMIC DATABASE BACKUP SCRIPT
 * 
 * This script exports all data from the database to JSON files.
 * It automatically detects all tables in the 'public' schema.
 * 
 * Usage: npx ts-node scripts/backup-database.ts
 */

import prisma from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

    console.log('🔐 Starting dynamic database backup...');
    console.log(`📁 Target: ${backupPath}`);

    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    fs.mkdirSync(backupPath, { recursive: true });

    try {
        // Automatically fetch all table names from the public schema
        // This avoids hardcoding table names and catches new Prisma models automatically
        const tableQueryResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma_migrations';`
        );

        const tableNames = tableQueryResult.map(t => t.tablename);
        console.log(`🔍 Detected ${tableNames.length} tables to backup.`);

        let totalRecords = 0;
        const metadata: any = {
            timestamp: new Date().toISOString(),
            tables: []
        };

        for (const tableName of tableNames) {
            try {
                // Fetch data using raw query to bypass Prisma client model limitations for dynamic tables
                const data = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "${tableName}"`);

                const filePath = path.join(backupPath, `${tableName}.json`);
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

                console.log(`  ✅ ${tableName}: ${data.length} records`);
                totalRecords += data.length;

                metadata.tables.push({
                    name: tableName,
                    count: data.length
                });
            } catch (error: any) {
                console.log(`  ⚠️ ${tableName}: Error - ${error.message}`);
            }
        }

        metadata.totalRecords = totalRecords;
        fs.writeFileSync(path.join(backupPath, 'metadata.json'), JSON.stringify(metadata, null, 2));

        console.log('\n✅ Backup completed successfully!');
        console.log(`📊 Total records: ${totalRecords}`);
        console.log(`📁 Location: ${backupPath}`);

        // Cleanup: remove older backups (keep last 5)
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('backup-'))
            .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (backups.length > 5) {
            console.log(`\n🧹 Cleaning up ${backups.length - 5} old backups...`);
            backups.slice(5).forEach(b => {
                fs.rmSync(path.join(BACKUP_DIR, b.name), { recursive: true, force: true });
                console.log(`  🗑️ Removed: ${b.name}`);
            });
        }

    } catch (error) {
        console.error('❌ Backup failure:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

backupDatabase();
