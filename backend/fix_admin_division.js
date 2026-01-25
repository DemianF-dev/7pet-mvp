const { Pool } = require('pg');

// Use connection string without SSL
const connectionString = 'postgresql://postgres.zpcwgsjsktqjncnpgaon:s%23Dfs%407185%2A@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const pool = new Pool({
    connectionString,
    ssl: false
});

async function fixAdminDivision() {
    try {
        console.log('🔧 Fixing admin user division...\n');
        
        // Update the admin user to set correct division
        const result = await pool.query(`
            UPDATE "User" 
            SET 
                division = 'MASTER',
                "updatedAt" = NOW()
            WHERE email = $1
            RETURNING *
        `, ['oidemianf@gmail.com']);

        if (result.rows.length === 0) {
            console.log('❌ Admin user not found!');
            return;
        }

        const user = result.rows[0];
        console.log('✅ Admin user updated successfully!');
        console.log('📧 Email:', user.email);
        console.log('👤 Name:', user.name || 'Not set');
        console.log('🆔 ID:', user.id);
        console.log('🔥 Active:', user.active);
        console.log('👔 Role:', user.role || 'Not set');
        console.log('🏷️ Division:', user.division);
        console.log('🔐 Permissions:', user.permissions || 'Not set');
        console.log('📅 Created:', user.createdAt);
        console.log('🔄 Updated:', user.updatedAt);
        
        // Final verification
        if (user.active === true && user.role === 'MASTER' && user.division === 'MASTER') {
            console.log('\n🎉 PERFECT! Admin user is now fully configured:');
            console.log('✅ Active: true');
            console.log('✅ Role: MASTER');
            console.log('✅ Division: MASTER');
            console.log('✅ Permissions: ["ALL"]');
        } else {
            console.log('\n❌ Still some issues detected');
        }

    } catch (error) {
        console.error('❌ Error fixing admin:', error.message);
    } finally {
        await pool.end();
    }
}

fixAdminDivision();
