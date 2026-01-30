const { Pool } = require('pg');

// Original one from Railway (masked)
// postgresql://postgres:s#Tecnologia@7185*@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true

// Fixed one
const projectRef = 'zpcwgsjsktqjncnpgaon';
const password = 's#Tecnologia@7185*';
// URL encode the password component properly
const encodedPassword = encodeURIComponent(password);
const connectionString = `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true`;

console.log('Testing connection to:', connectionString.replace(/:[^:]*@/, ':***@'));

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT 1').then(() => {
    console.log('✅ FIXED CONNECTION WORKS!');
    process.exit(0);
}).catch(e => {
    console.error('❌ STILL FAILING:', e.message);
    process.exit(1);
});
