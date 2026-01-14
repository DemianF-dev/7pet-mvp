
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { randomUUID } from 'crypto';

/**
 * 🛠️ UTILS: Súper Simple CSV Parser (No dependencies!)
 * Handles quoted fields correctly.
 */
function parseCSVLine(line: string, delimiter: string = ';'): string[] {
    const values: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (insideQuotes && line[i + 1] === '"') {
                // Double quote inside quotes = literal quote
                current += '"';
                i++;
            } else {
                // Toggle quote state
                insideQuotes = !insideQuotes;
            }
        } else if (char === delimiter && !insideQuotes) {
            // End of field
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values;
}


/**
 * ✨ MAIN IMPORT SCRIPT
 */
async function importBitrixData() {
    const csvFilePath = path.join(__dirname, 'bitrix_export.csv'); // ARQUIVO DEVE ESTAR AQUI

    if (!fs.existsSync(csvFilePath)) {
        console.error('❌ Arquivo "scripts/bitrix_export.csv" não encontrado!');
        console.log('📌 Por favor, coloque o arquivo CSV exportado do Bitrix na pasta "backend/scripts" com o nome "bitrix_export.csv".');
        process.exit(1);
    }

    console.log('🚀 Iniciando leitura do arquivo...');
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    const lines = fileContent.split(/\r?\n/).filter(l => l.trim().length > 0);

    if (lines.length < 2) {
        console.error('❌ Arquivo vazio ou sem dados.');
        process.exit(1);
    }

    // Header Mapping
    // "ID", "Nome", "Sobrenome", ... "23. Nome do Pet 1"
    const headers = parseCSVLine(lines[0]).map(h => h.trim());

    // Helper to get value by header name
    const getVal = (row: string[], headerName: string): string | undefined => {
        const index = headers.indexOf(headerName);
        if (index === -1) return undefined;
        return row[index]?.trim() || undefined;
    };

    console.log(`📊 Encontradas ${lines.length - 1} linhas de dados.`);
    console.log('⏳ Iniciando importação no banco de dados...');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length < headers.length * 0.5) continue; // Skip broken lines

        try {
            const bitrixId = getVal(row, 'ID');
            const firstName = getVal(row, 'Nome') || 'Sem Nome';
            const lastName = getVal(row, 'Sobrenome') || '';
            const fullName = `${firstName} ${lastName}`.trim();

            // Email generation if missing (required for User creation)
            let email = getVal(row, 'Email de trabalho') || getVal(row, 'Outro e-mail');
            if (!email) {
                // Generate a dummy placeholders email for migration if needed, or skip
                // For 7Pet, let's create a placeholder based on ID
                email = `bitrix_migration_${bitrixId}@nomail.com`;
            }
            email = email.toLowerCase().replace(/\s/g, '');

            const phone = getVal(row, 'Celular') || getVal(row, 'Telefone de trabalho');

            // --- 1. UPSERT USER ---
            let user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        name: fullName,
                        email: email,
                        phone: phone,
                        firstName: firstName,
                        lastName: lastName,
                        address: getVal(row, '23. Endereço do Tutor'),
                        role: 'CLIENTE',
                        division: 'CLIENTE',
                        passwordHash: '$2a$12$PlaceHolderHashForMigrationOnly', // User needs to reset password
                        active: true,
                    }
                });
            } else {
                // Update existing user info if needed
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        phone: phone || user.phone,
                        address: getVal(row, '23. Endereço do Tutor') || user.address
                    }
                });
            }

            // --- 2. UPSERT CUSTOMER ---
            let customer = await prisma.customer.findUnique({ where: { userId: user.id } });

            if (!customer) {
                customer = await prisma.customer.create({
                    data: {
                        userId: user.id,
                        name: fullName,
                        phone: phone,
                        address: getVal(row, '23. Endereço do Tutor'),
                        legacyBitrixId: bitrixId,
                        cpf: getVal(row, '23. CPF (Cadastro de Pessoa Física)'),
                        discoverySource: getVal(row, '23. Como conheceu a 7Pet?'),
                        secondaryGuardianName: getVal(row, '23. Nome do Tutor/Responsável 2'),
                        secondaryGuardianPhone: getVal(row, '23. Telefone Tutor 2'),
                        secondaryGuardianEmail: getVal(row, '23. E-mail Tutor 2'),
                        internalNotes: getVal(row, 'Comentário'),
                        riskLevel: 'Nivel 1' // Default
                    }
                });
            } else {
                // Update legacy ID if mapping to existing customer
                await prisma.customer.update({
                    where: { id: customer.id },
                    data: { legacyBitrixId: bitrixId }
                });
            }

            // --- 3. PROCESS PETS (1, 2, 3) ---
            const petsToProcess = [1, 2, 3];

            for (const num of petsToProcess) {
                const petName = getVal(row, `23. Nome do Pet ${num}`);
                if (!petName || petName.length < 2) continue; // Skip empty pets

                const species = getVal(row, `23. Espécie do Pet ${num}`) || 'Canino';
                const breed = getVal(row, `23. Raça do Pet ${num}`);

                // Try parsing weight safely
                const weightRaw = getVal(row, `23. Peso do Pet ${num}`) || '0';
                const weight = parseFloat(weightRaw.replace(',', '.').replace(/[^\d.]/g, '')) || 0;

                // Create Pet
                await prisma.pet.create({
                    data: {
                        customerId: customer.id,
                        name: petName,
                        species: species,
                        breed: breed,
                        weight: weight,
                        size: getVal(row, `23. Porte do Pet ${num}`),
                        sex: getVal(row, `23. Sexo do Pet ${num}:`) || getVal(row, `23. Sexo Pet ${num}:`),
                        observations: getVal(row, `23. Observações Pet ${num} (INTERNO)`),
                        hasSpecialNeeds: getVal(row, `23. Pet(s) com necessidades especiais?`) === 'Sim',
                        // Map other misc fields to the first pet found or generic notes? 
                        // For simplicity, we strictly map indexed fields to indexed pets.
                    }
                });
            }

            successCount++;
            if (successCount % 10 === 0) process.stdout.write('.');

        } catch (error) {
            console.error(`\n❌ Erro na linha ${i + 1}:`, error);
            errorCount++;
        }
    }

    console.log('\n\n🏁 Importação Concluída!');
    console.log(`✅ Sucesso: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`⏭️ Pulados: ${skippedCount}`);
}

importBitrixData()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
