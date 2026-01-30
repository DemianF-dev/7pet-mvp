const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:s%23Tecnologia%407185*@db.zpcwgsjsktqjncnpgaon.supabase.co:5432/postgres' });
pool.query('UPDATE "User" SET role = $1, division = $2 WHERE email = $3', ['MASTER', 'MASTER', 'oidemianf@gmail.com']).then(res => {
    console.log('Update result:', res.rowCount);
}).catch(e => console.error(e.message)).finally(() => pool.end());
