const fetch = require('node-fetch');

async function testChatUsers() {
    try {
        console.log('Testing /chat/users endpoint...');
        
        // First, login to get a token
        const loginResponse = await fetch('http://localhost:3001/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@7pet.com.br',
                password: 'admin123'
            })
        });
        
        if (!loginResponse.ok) {
            console.error('Login failed:', await loginResponse.text());
            return;
        }
        
        const loginData = await loginResponse.json();
        console.log('Login successful, got token');
        
        // Now test the chat users endpoint
        const chatResponse = await fetch('http://localhost:3001/chat/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Chat users response status:', chatResponse.status);
        const chatData = await chatResponse.json();
        console.log('Chat users response:', JSON.stringify(chatData, null, 2));
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testChatUsers();
