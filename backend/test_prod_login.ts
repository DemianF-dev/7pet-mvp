
import axios from 'axios';

async function testProductionLogin() {
    const url = 'https://7pet-mvp-production.up.railway.app/auth/login';
    const email = 'oidemianf@gmail.com';
    const password = 'anypassword';
    console.log(`Testing PRODUCTION login at ${url}...`);
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

testProductionLogin();
