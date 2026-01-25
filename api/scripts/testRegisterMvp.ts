
import * as authService from '../services/authService';

async function main() {
    console.log('🧪 Testing User Registration...');
    const randomEmail = `test.user.${Date.now()}@example.com`;
    console.log(`Trying to register: ${randomEmail}`);

    try {
        const result = await authService.register({
            name: 'Test User',
            email: randomEmail,
            phone: '11999990000',
            password: 'password123',
            role: 'CLIENTE'
        });
        console.log('✅ Registration Successful!');
        console.log('User ID:', result.user.id);
        console.log('Token generated:', !!result.token);
    } catch (error: any) {
        console.error('❌ Registration Failed:', error);
        console.error('Error Stack:', error.stack);
    }
}

main();
