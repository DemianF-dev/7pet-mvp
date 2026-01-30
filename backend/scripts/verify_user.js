const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: 'postgresql://postgres:s%23Tecnologia%407185*@db.zpcwgsjsktqjncnpgaon.supabase.co:5432/postgres' });

async function checkUser(email) {
    const result = await pool.query('SELECT id, email, "passwordHash", role, division FROM "User" WHERE email = $1', [email]);
    if (result.rows.length === 0) {
        console.log('❌ User not found:', email);
        return;
    }

    const user = result.rows[0];
    console.log('✅ User found:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - Division:', user.division);
    console.log('  - Has Password Hash:', !!user.passwordHash);

    if (user.passwordHash) {
        // Test password: s#Dfs@master*85
        const testPassword = 's#Dfs@master*85';
        const isValid = await bcrypt.compare(testPassword, user.passwordHash);
        console.log('  - Password "s#Dfs@master*85" valid:', isValid);
    }

    pool.end();
}

const email = process.argv[2] || 'oidemianf@gmail.com';
checkUser(email).catch(console.error);
