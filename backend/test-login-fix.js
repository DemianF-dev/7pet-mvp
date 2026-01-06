const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testLogin() {
    console.log('🧪 Testando login...\n');

    try {
        // Test with a demo user email 
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@7pet.com',
            password: 'admin123',
            rememberMe: false
        });

        console.log('✅ Login bem-sucedido!');
        console.log('👤 Usuário:', response.data.user.name);
        console.log('🔑 Token recebido:', response.data.token ? 'Sim' : 'Não');
        console.log('📧 Email:', response.data.user.email);
        console.log('👔 Role:', response.data.user.role);
        console.log('\n✅ TESTE PASSOU - Erro 500 corrigido!');
        return true;
    } catch (error) {
        if (error.response) {
            console.log('❌ Erro na requisição:');
            console.log('Status:', error.response.status);
            console.log('Mensagem:', error.response.data);

            if (error.response.status === 500) {
                console.log('\n❌ ERRO 500 AINDA PRESENTE');
                return false;
            } else if (error.response.status === 401) {
                console.log('\n⚠️ Credenciais inválidas (mas não é erro 500!)');
                console.log('Tente com outro usuário existente no banco de dados');
                return true; // Not a 500 error, so the fix worked
            }
        } else {
            console.log('❌ Erro de conexão:', error.message);
            console.log('Verifique se o backend está rodando em http://localhost:3001');
        }
        return false;
    }
}

testLogin();
