const https = require('https');

const CONFIG = {
    backend: 'https://7pet-backend-production.up.railway.app/api/health',
    realtime: 'https://7pet-realtime-production.up.railway.app/health',
    timeout: 10000
};

async function checkHealth(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const json = JSON.parse(data);
                        resolve({ ok: true, status: res.statusCode, data: json });
                    } catch (e) {
                        resolve({ ok: true, status: res.statusCode, raw: data });
                    }
                } else {
                    resolve({ ok: false, status: res.statusCode, error: data });
                }
            });
        });

        req.on('error', (e) => resolve({ ok: false, error: e.message }));
        req.setTimeout(CONFIG.timeout, () => {
            req.destroy();
            resolve({ ok: false, error: 'Timeout' });
        });
    });
}

async function run() {
    console.log('🔍 Iniciando verificação pós-deploy...');

    const results = {
        backend: await checkHealth(CONFIG.backend),
        realtime: await checkHealth(CONFIG.realtime)
    };

    let allOk = true;

    console.log('\n--- Status do Backend ---');
    if (results.backend.ok) {
        console.log('✅ OK (Status ' + results.backend.status + ')');
    } else {
        console.log('❌ FALHA: ' + results.backend.error);
        allOk = false;
    }

    console.log('\n--- Status do Realtime ---');
    if (results.realtime.ok) {
        console.log('✅ OK (Status ' + results.realtime.status + ')');
    } else {
        console.log('❌ FALHA: ' + results.realtime.error);
        allOk = false;
    }

    console.log('\n--------------------------');
    if (allOk) {
        console.log('🚀 RESULTADO: Deploy validado com sucesso!');
        process.exit(0);
    } else {
        console.log('⚠️ RESULTADO: O deploy está instável ou falhou. Verifique os logs.');
        process.exit(1);
    }
}

run();
