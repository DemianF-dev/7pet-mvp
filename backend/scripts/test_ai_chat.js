const https = require('https');

const data = JSON.stringify({
    messages: [
        { role: 'user', content: 'Olá, você está funcionando?' }
    ]
});

const options = {
    hostname: '7pet-mvp-production.up.railway.app',
    port: 443,
    path: '/brain/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': 'Bearer test-token'
    }
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
        console.log('Chunk:', chunk.toString());
    });

    res.on('end', () => {
        console.log('\nFull Response:', body);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
