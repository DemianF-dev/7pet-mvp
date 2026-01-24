require('dotenv').config();
const { Pool } = require('pg');

async function checkUser() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL.split('?')[0],
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        const client = await pool.connect();
        console.log('--- CONNECTED TO DATABASE ---');

        const res = await client.query('SELECT id, email, role, "passwordHash", "plainPassword", active FROM "User" WHERE email = $1', ['oidemianf@gmail.com']);

        if (res.rows.length === 0) {
            console.log('USER NOT FOUND');
            const total = await client.query('SELECT count(*) FROM "User"');
            console.log('Total users:', total.rows[0].count);
        } else {
            const user = res.rows[0];
            console.log('USER DATA:', JSON.stringify({
                ...user,
                passwordHash: user.passwordHash ? 'PRESENT' : 'MISSING',
                plainPassword: user.plainPassword
            }, null, 2));

            if (user.plainPassword) {
                console.log('Plain password available in DB.');
            }
        }

        client.release();
    } catch (err) {
        console.error('ERROR:', err.message);
        if (err.message.includes('certificate')) {
            console.log('TIP: SSL Certificate validation failed. This is likely why the app is failing too.');
        }
    } finally {
        await pool.end();
    }
}

checkUser();
