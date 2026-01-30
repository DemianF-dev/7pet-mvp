const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: 'postgresql://postgres:s%23Tecnologia%407185*@db.zpcwgsjsktqjncnpgaon.supabase.co:5432/postgres' });

async function setPassword() {
    const email = 'oidemianf@gmail.com';
    const password = 's#Dfs@master*85';

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
        'UPDATE "User" SET "passwordHash" = $1 WHERE email = $2 RETURNING id, email',
        [passwordHash, email]
    );

    if (result.rows.length > 0) {
        console.log('✅ Password set for:', result.rows[0].email);
        console.log('   User ID:', result.rows[0].id);
        console.log('   Password:', password);
    } else {
        console.log('❌ User not found');
    }

    pool.end();
}

setPassword().catch(console.error);
