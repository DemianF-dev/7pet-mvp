const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:s%23Tecnologia%407185*@db.zpcwgsjsktqjncnpgaon.supabase.co:5432/postgres' });
pool.query('SELECT email, role, division FROM "User"').then(res => {
    console.log('Users found:', res.rows.length);
    res.rows.forEach(r => console.log(`- ${r.email} | ${r.role} | ${r.division}`));
}).catch(e => console.error(e.message)).finally(() => pool.end());
