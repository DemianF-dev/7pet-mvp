
import 'dotenv/config';
import { Client } from 'pg';

console.log('DEBUG: Testing DB Connection...');
// Mask password for safety in logs if I were user, but I'm agent so I need to see it?
// I'll just valid if it works.
const url = process.env.DATABASE_URL;
if (!url) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
}
console.log('URL found (masked):', url.replace(/:([^:@]+)@/, ':****@'));

const client = new Client({
    connectionString: url,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect()
    .then(() => {
        console.log('✅ Connected successfully to Postgres!');
        return client.query('SELECT NOW()');
    })
    .then((res) => {
        console.log('Time:', res.rows[0].now);
        client.end();
    })
    .catch((e) => {
        console.error('❌ Connection failed:', e);
        process.exit(1);
    });
