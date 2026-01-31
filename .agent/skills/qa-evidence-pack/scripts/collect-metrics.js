const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    apiHealth: 'https://7pet-backend-production.up.railway.app/api/health',
    frontendDist: path.resolve(__dirname, '../../../../frontend/dist'),
    backendDist: path.resolve(__dirname, '../../../../backend/dist')
};

async function measureLatency(url) {
    const start = Date.now();
    return new Promise((resolve) => {
        const req = https.get(url, (res) => {
            res.on('data', () => { });
            res.on('end', () => resolve(Date.now() - start));
        });
        req.on('error', () => resolve('N/A'));
        req.setTimeout(5000, () => {
            req.destroy();
            resolve('Timeout');
        });
    });
}

function getBundleSize(dirPath) {
    if (!fs.existsSync(dirPath)) return 'N/A (Build missing)';

    let totalSize = 0;
    const files = fs.readdirSync(dirPath, { recursive: true });

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isFile()) {
            totalSize += fs.statSync(fullPath).size;
        }
    });

    return (totalSize / 1024 / 1024).toFixed(2) + ' MB';
}

async function run() {
    console.log('📊 Coletando métricas para o Evidence Pack...');

    const latency = await measureLatency(CONFIG.apiHealth);
    const feSize = getBundleSize(CONFIG.frontendDist);
    const beSize = getBundleSize(CONFIG.backendDist);

    console.log(JSON.stringify({
        latency: latency + 'ms',
        bundleSize: {
            frontend: feSize,
            backend: beSize
        },
        timestamp: new Date().toISOString()
    }, null, 2));
}

run();
