import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function configureAllRLS() {
    try {
        console.log('🔐 CONFIGURANDO RLS PARA TODAS AS TABELAS\n');
        console.log('═'.repeat(60));

        // Read the SQL file
        const sqlFilePath = path.join(__dirname, 'configure_all_rls.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

        // Split by semicolon and filter
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => {
                // Remove empty lines and comments
                return s.length > 0 &&
                    !s.startsWith('--') &&
                    !s.match(/^\/\//);
            });

        console.log(`\n📋 Total de statements a executar: ${statements.length}\n`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            const statementNum = i + 1;

            // Show abbreviated statement for logging
            const preview = statement
                .replace(/\s+/g, ' ')
                .substring(0, 80) + (statement.length > 80 ? '...' : '');

            try {
                await prisma.$executeRawUnsafe(statement + ';');
                successCount++;
                console.log(`✅ [${statementNum}/${statements.length}] OK: ${preview}`);

            } catch (error: any) {
                const errorMessage = error.message || '';

                // Check if it's a "already exists" error (not critical)
                if (errorMessage.includes('already exists') ||
                    errorMessage.includes('já existe')) {
                    skipCount++;
                    console.log(`⚠️  [${statementNum}/${statements.length}] SKIP: ${preview}`);
                    console.log(`    (já existe)\n`);

                } else {
                    errorCount++;
                    console.log(`❌ [${statementNum}/${statements.length}] ERRO: ${preview}`);
                    console.log(`    ${errorMessage}\n`);
                }
            }
        }

        console.log('\n' + '═'.repeat(60));
        console.log('📊 RESUMO DA EXECUÇÃO\n');
        console.log(`   ✅ Sucesso: ${successCount}`);
        console.log(`   ⚠️  Já existem: ${skipCount}`);
        console.log(`   ❌ Erros: ${errorCount}`);
        console.log(`   📝 Total: ${statements.length}\n`);

        if (errorCount === 0) {
            console.log('✅ RLS CONFIGURADO COM SUCESSO!\n');
            console.log('📋 Políticas aplicadas por tabela:\n');
            console.log('   1. TransportSettings:');
            console.log('      - SELECT: Staff apenas');
            console.log('      - UPDATE: Admin/Gerencial');
            console.log('      - INSERT/DELETE: Admin\n');

            console.log('   2. BugReport:');
            console.log('      - SELECT: Próprio usuário + Staff');
            console.log('      - INSERT: Qualquer autenticado');
            console.log('      - UPDATE: Próprio usuário + Admin');
            console.log('      - DELETE: Admin\n');

            console.log('   3. Authenticator:');
            console.log('      - Todas operações: Apenas próprio usuário\n');

            console.log('   4. Product:');
            console.log('      - SELECT: Todos autenticados');
            console.log('      - INSERT/UPDATE: Admin/Gerencial');
            console.log('      - DELETE: Admin\n');

            console.log('   5. AuditLog:');
            console.log('      - SELECT: Admin/Gerencial');
            console.log('      - INSERT/UPDATE/DELETE: Via service role\n');

            console.log('   6. RolePermission:');
            console.log('      - SELECT: Todos autenticados');
            console.log('      - INSERT/UPDATE/DELETE: Admin\n');

            console.log('🔒 Acesso anônimo BLOQUEADO em todas as tabelas!');
            console.log('═'.repeat(60) + '\n');

        } else {
            console.log('⚠️  Algumas políticas falharam. Verifique os erros acima.\n');
            console.log('💡 Dica: Se for erro de "circuit breaker", aguarde 1-2 minutos');
            console.log('   e execute novamente: npm run rls:apply\n');
        }

    } catch (error) {
        console.error('❌ ERRO CRÍTICO:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

configureAllRLS();
