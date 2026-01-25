import dotenv from 'dotenv';
dotenv.config();

const axios = require('axios');

async function testFixedUsersLogin() {
    const baseUrl = 'http://localhost:3001';
    const usersToTest = [
        { email: 'marcio@gmail.com', password: '123456' },
        { email: 'claudio@gmail.com', password: '123456' },
    ];

    console.log('🔍 Testing login for FIXED users...\n');

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
                console.log(`   Customer Type: ${response.data.user.customer.type}`);
            }
            
            console.log(`   Token received: ${!!response.data.token}`);
            console.log(`   Token length: ${response.data.token ? response.data.token.length : 0}\n`);
            
        } catch (error: any) {
            console.log('❌ LOGIN FAILED');
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${error.response.data.error || 'Unknown error'}`);
                if (error.response.data.details) {
                    console.log(`   Details: ${JSON.stringify(error.response.data.details)}`);
                }
            } else if (error.code === 'ECONNREFUSED') {
                console.log(`   Backend server is not running`);
                console.log(`   Please start the backend server with: npm run dev`);
            } else {
                console.log(`   Message: ${error.message}`);
            }
            console.log('');
        }
    }

    console.log('📝 Login Instructions:');
    console.log('   If the backend is running, these users should now be able to login:');
    console.log('   marcio@gmail.com / 123456');
    console.log('   claudio@gmail.com / 123456');
}

testFixedUsersLogin().catch(console.error);