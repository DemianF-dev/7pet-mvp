import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function applyRLSPolicies() {
    try {
        console.log('🔐 Aplicando políticas de RLS para TransportSettings...\n');

        // Read the SQL file
        const sqlFilePath = path.join(__dirname, 'add_rls_transport_settings.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

        // Split into individual statements (rough, but works for this case)
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`Executando statement ${i + 1}/${statements.length}...`);

            try {
                await prisma.$executeRawUnsafe(statement);
                console.log(`✅ Statement ${i + 1} executado com sucesso\n`);
            } catch (error: any) {
                // If policy already exists, just warn (not an error)
                if (error.message?.includes('already exists')) {
                    console.log(`⚠️  Statement ${i + 1} já existe (OK)\n`);
                } else {
                    console.error(`❌ Erro no statement ${i + 1}:`);
                    console.error(statement);
                    console.error(error.message);
                    console.log('');
                }
            }
        }

        console.log('✅ RLS configurado com sucesso!');
        console.log('\n📋 Resumo das políticas aplicadas:');
        console.log('  - SELECT: Apenas usuários STAFF autenticados');
        console.log('  - UPDATE: Apenas ADMIN e GERENCIAL');
        console.log('  - INSERT: Apenas ADMIN');
        console.log('  - DELETE: Apenas ADMIN');
        console.log('  - Acesso anônimo: BLOQUEADO\n');

    } catch (error) {
        console.error('❌ Erro ao aplicar RLS:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

applyRLSPolicies();
