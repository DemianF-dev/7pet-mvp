
import axios from 'axios';

async function testApiPrefix() {
    const url = 'https://7pet-mvp-production.up.railway.app/api/auth/login';
    const email = 'oidemianf@gmail.com';
    const password = 'anypassword';
    console.log(`Testing with /api prefix at ${url}...`);
    try {
        const response = await axios.post(url, {
            email,
            password
        });
        console.log('Login success (unexpected):', response.data);
    } catch (error: any) {
        console.log('Login failed:');
        console.log('Status:', error.response?.status);
        console.log('Data:', JSON.stringify(error.response?.data));
    }
}

testApiPrefix();
