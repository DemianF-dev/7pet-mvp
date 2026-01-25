import axios from 'axios';

const API_URL = 'http://localhost:3001';

async function testRegistration() {
    console.log('🧪 Testing Client Registration Flow...\n');

    const testEmail = `test.${Date.now()}@example.com`;
    const testData = {
        name: 'Test User Registration',
        email: testEmail,
        phone: '11999998888',
        password: 'password123',
        role: 'CLIENTE'
    };

    console.log('📤 Sending POST request to /auth/register');
    console.log('Data:', JSON.stringify(testData, null, 2));

    try {
        const response = await axios.post(`${API_URL}/auth/register`, testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('\n✅ Registration Successful!');
        console.log('Status:', response.status);
        console.log('User ID:', response.data.user?.id);
        console.log('Has Token:', !!response.data.token);
        console.log('User Name:', response.data.user?.name);
        console.log('User Email:', response.data.user?.email);
    } catch (error: any) {
        console.error('\n❌ Registration Failed!');
        console.error('Status:', error.response?.status || 'No response');
        console.error('Error Message:', error.response?.data?.error || error.message);
        console.error('Full Error:', error.response?.data || error.message);
    }
}

testRegistration();
