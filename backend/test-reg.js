const http = require('http');

async function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function test() {
    console.log('--- API TEST: Registration & Pet Creation ---');
    const timestamp = Date.now();
    const regData = JSON.stringify({
        email: 'debug' + timestamp + '@7pet.com',
        password: 'password123',
        name: 'Debug User',
        role: 'CLIENTE'
    });

    try {
        const regRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(regData)
            }
        }, regData);

        console.log('REGISTRATION STATUS:', regRes.status);
        if (regRes.status !== 201) {
            console.log('REGISTRATION FAILED:', regRes.body);
            process.exit(1);
        }

        const token = regRes.body.token;

        const petData = JSON.stringify({
            name: 'Rex',
            species: 'Cachorro'
        });

        const petRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/pets',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(petData),
                'Authorization': `Bearer ${token}`
            }
        }, petData);

        console.log('PET CREATION STATUS:', petRes.status);
        if (petRes.status !== 201) {
            console.log('PET CREATION FAILED:', petRes.body);
            process.exit(1);
        }

        console.log('--- ALL TESTS PASSED ---');
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
}

test();
