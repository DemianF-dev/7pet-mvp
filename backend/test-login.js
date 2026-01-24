const axios = require('axios');

async function testLogin() {
    const url = 'http://localhost:3001/auth/login';
    const payload = {
        email: 'oidemianf@gmail.com',
        password: 'master123'
    };

    console.log(`Testing login for ${payload.email}...`);
    try {
        const response = await axios.post(url, payload);
        console.log('LOGIN SUCCESSFUL!');
        console.log('User Role:', response.data.user.role);
        console.log('Token received:', !!response.data.token);
    } catch (error) {
        console.error('LOGIN FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
    }
}

testLogin();
