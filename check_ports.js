
const http = require('http');

function check(port, path = '/') {
    const options = {
        hostname: 'localhost',
        port: port,
        path: path,
        method: 'GET',
        timeout: 2000
    };

    const req = http.request(options, (res) => {
        console.log(`Port ${port}${path}: Status ${res.statusCode}`);
    });

    req.on('error', (e) => {
        console.error(`Port ${port}${path}: Error - ${e.message}`);
    });

    req.on('timeout', () => {
        console.error(`Port ${port}${path}: Timeout`);
        req.destroy();
    });

    req.end();
}

console.log('Checking ports...');
check(3001, '/health');
check(5173, '/');
