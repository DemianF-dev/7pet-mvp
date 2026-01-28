
import axios from 'axios';

async function testLogin() {
    const email = 'oidemianf@gmail.com';
    const password = 'wrongpassword';
    console.log(`Testing local login for ${email}...`);
    try {
        const response = await axios.post('http://localhost:3001/auth/login', {
            email,
            password
        });
        console.log('Login success (unexpected):', response.data);
    } catch (error: any) {
        console.log('Login failed as expected:');
        console.log('Status:', error.response?.status);
        console.log('Data:', JSON.stringify(error.response?.data));
    }
}

testLogin();
