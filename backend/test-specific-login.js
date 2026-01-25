const axios = require('axios');

async function testSpecificUsers() {
    const baseUrl = 'http://localhost:3001';
    const usersToTest = [
        { email: 'marcio@gmail.com', password: '123456' },
        { email: 'claudio@gmail.com', password: '123456' },
    ];

    console.log('🔍 Testing login for specific problematic users...\n');

    for (const user of usersToTest) {
        console.log(`📧 Testing login for: ${user.email}`);
        
        try {
            const response = await axios.post(`${baseUrl}/auth/login`, {
                email: user.email,
                password: user.password
            });
            
            console.log('✅ LOGIN SUCCESSFUL!');
            console.log(`   User ID: ${response.data.user.id}`);
            console.log(`   Name: ${response.data.user.name || 'Not set'}`);
            console.log(`   Role: ${response.data.user.role}`);
            console.log(`   Division: ${response.data.user.division}`);
            console.log(`   Active: ${response.data.user.active}`);
            console.log(`   Customer Profile: ${response.data.user.customer ? 'YES' : 'NO'}`);
            
            if (response.data.user.customer) {
                console.log(`   Customer Blocked: ${response.data.user.customer.isBlocked}`);
            }
            
            console.log(`   Token received: ${!!response.data.token}\n`);
            
        } catch (error) {
            console.log('❌ LOGIN FAILED');
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${error.response.data.error || 'Unknown error'}`);
                if (error.response.data.details) {
                    console.log(`   Details: ${JSON.stringify(error.response.data.details)}`);
                }
            } else {
                console.log(`   Message: ${error.message}`);
            }
            console.log('');
        }
    }
}

testSpecificUsers().catch(console.error);