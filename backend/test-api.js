const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function test() {
    console.log('--- API TEST: Registration & Pet Creation ---');
    const timestamp = Date.now();
    const email = `test${timestamp}@7pet.com`;
    const password = 'password123';
    const name = 'Test User';

    try {
        console.log(`1. Registering user: ${email}...`);
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            email,
            password,
            name,
            role: 'CLIENTE'
        });
        const token = regRes.data.token;
        const user = regRes.data.user;
        console.log('   Success! User ID:', user.id);
        console.log('   Customer ID:', user.customer?.id);

        if (!user.customer?.id) {
            console.error('   ERROR: Customer record missing in registration response!');
        }

        console.log('2. Creating a pet for the new user...');
        const petRes = await axios.post(`${API_URL}/pets`, {
            name: 'Rex',
            species: 'Cachorro',
            weight: 15.5
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Success! Pet ID:', petRes.data.id);

        console.log('3. Trying to create a pet with empty weight (testing fix)...');
        const petEmptyRes = await axios.post(`${API_URL}/pets`, {
            name: 'Whiskers',
            species: 'Gato'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Success! Pet ID:', petEmptyRes.data.id);

        console.log('--- ALL TESTS PASSED ---');
    } catch (error) {
        console.error('--- TEST FAILED ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

test();
