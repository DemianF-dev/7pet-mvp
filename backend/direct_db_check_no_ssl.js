const { Pool } = require('pg');

// Use connection string without SSL
const connectionString = 'postgresql://postgres.zpcwgsjsktqjncnpgaon:s%23Dfs%407185%2A@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const pool = new Pool({
    connectionString,
    ssl: false
});

async function checkAdminUser() {
    try {
        console.log('🔍 Checking admin user via direct DB connection...\n');
        
        const result = await pool.query(`
            SELECT 
                id,
                email,
                name,
                active,
                role,
                division,
                permissions,
                "createdAt",
                "updatedAt"
            FROM "User" 
            WHERE email = $1
        `, ['oidemianf@gmail.com']);

        if (result.rows.length === 0) {
            console.log('❌ Admin user not found!');
            console.log('📧 Email searched: oidemianf@gmail.com');
            return;
        }

        const user = result.rows[0];
        console.log('✅ Admin user found:');
        console.log('📧 Email:', user.email);
        console.log('👤 Name:', user.name || 'Not set');
        console.log('🆔 ID:', user.id);
        console.log('🔥 Active:', user.active);
        console.log('👔 Role:', user.role || 'Not set');
        console.log('🏷️ Division:', user.division);
        console.log('🔐 Permissions:', user.permissions || 'Not set');
        console.log('📅 Created:', user.createdAt);
        console.log('🔄 Updated:', user.updatedAt);
        
        // Check if active is true
        if (user.active === true) {
            console.log('\n✅ SUCCESS: Admin user has active=true');
        } else {
            console.log('\n❌ PROBLEM: Admin user has active=' + user.active);
            console.log('🔧 Need to run fix script');
        }

        // Check if role is properly set
        if (user.role === 'MASTER' || user.role === 'ADMIN') {
            console.log('✅ Role is properly set:', user.role);
        } else {
            console.log('❌ Role issue:', user.role || 'NULL');
        }

        // Check division
        if (user.division === 'MASTER') {
            console.log('✅ Division is properly set:', user.division);
        } else {
            console.log('❌ Division issue:', user.division);
        }

    } catch (error) {
        console.error('❌ Error checking admin:', error.message);
    } finally {
        await pool.end();
    }
}

checkAdminUser();
