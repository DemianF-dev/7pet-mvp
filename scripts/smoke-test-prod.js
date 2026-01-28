
const https = require('https');

const API_URL = 'https://7pet-backend-production.up.railway.app'; // Ajuste se seu URL de backend for diferente no Railway

console.log(`🔍 Testando saúde do backend em: ${API_URL}`);

const req = https.get(`${API_URL}/api/health`, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (d) => {
        process.stdout.write(d);
        console.log('\n✅ Conexão bem sucedida!');
    });
});

req.on('error', (e) => {
    console.error(`❌ Erro de conexão: ${e.message}`);
    console.log('Verifique se o deploy no Railway terminou e se a URL está correta.');
});
