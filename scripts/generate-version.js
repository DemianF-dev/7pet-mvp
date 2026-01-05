const fs = require('fs');
const path = require('path');

/**
 * Script para gerar automaticamente o número de versão
 * Formato: NOME+YYYYMMDD-HHMM
 * Exemplo: BETA20260105-0041
 */

function generateVersion(stage = 'BETA') {
    const now = new Date();

    // Ajustar para timezone de Brasília (UTC-3)
    const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

    const year = brazilTime.getFullYear();
    const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
    const day = String(brazilTime.getDate()).padStart(2, '0');
    const hours = String(brazilTime.getHours()).padStart(2, '0');
    const minutes = String(brazilTime.getMinutes()).padStart(2, '0');

    const version = `${stage}${year}${month}${day}-${hours}${minutes}`;
    const timestamp = brazilTime.toISOString();

    return { version, timestamp };
}

function updateVersionFile(stage = 'BETA', releaseNotes = 'Build automático') {
    const versionPath = path.join(__dirname, '..', 'VERSION.json');

    let currentVersion = {};
    if (fs.existsSync(versionPath)) {
        currentVersion = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    }

    const { version, timestamp } = generateVersion(stage);

    // Tentar obter o commit hash do git
    let commit = 'unknown';
    try {
        const { execSync } = require('child_process');
        commit = execSync('git rev-parse --short HEAD').toString().trim();
    } catch (e) {
        console.warn('Não foi possível obter commit hash do git');
    }

    const newVersion = {
        version,
        stage,
        timestamp,
        commit,
        buildNumber: (currentVersion.buildNumber || 0) + 1,
        releaseNotes
    };

    fs.writeFileSync(versionPath, JSON.stringify(newVersion, null, 2));

    console.log('✅ Versão atualizada com sucesso!');
    console.log(`📦 Versão: ${version}`);
    console.log(`🏷️  Estágio: ${stage}`);
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`🔖 Commit: ${commit}`);
    console.log(`#️⃣  Build: ${newVersion.buildNumber}`);

    return newVersion;
}

// Executar se chamado diretamente
if (require.main === module) {
    const args = process.argv.slice(2);
    const stage = args[0] || 'BETA';
    const releaseNotes = args[1] || 'Build automático';

    updateVersionFile(stage, releaseNotes);
}

module.exports = { generateVersion, updateVersionFile };
