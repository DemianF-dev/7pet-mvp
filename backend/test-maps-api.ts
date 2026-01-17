import dotenv from 'dotenv';
import { Client, TravelMode } from '@googlemaps/google-maps-services-js';

dotenv.config();

const client = new Client({});

async function testGoogleMapsKey() {
    console.log('=== TESTE DA GOOGLE MAPS API KEY ===\n');

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error('❌ GOOGLE_MAPS_API_KEY não encontrada no .env');
        process.exit(1);
    }

    console.log('✅ Chave encontrada no .env');
    console.log('📝 Primeiros caracteres:', apiKey.substring(0, 20) + '...');
    console.log('📏 Tamanho da chave:', apiKey.length, 'caracteres\n');

    console.log('🧪 Testando chamada à Distance Matrix API...\n');

    try {
        const response = await client.distancematrix({
            params: {
                origins: ['Av. Hildebrando de Lima, 525, Osasco - SP'],
                destinations: ['Av. Paulista, 1000, São Paulo - SP'],
                key: apiKey,
                language: 'pt-BR',
                mode: TravelMode.driving
            }
        });

        console.log('✅ Sucesso! Status da API:', response.data.status);

        if (response.data.status === 'OK') {
            const element = response.data.rows[0]?.elements[0];
            if (element && element.status === 'OK') {
                console.log('📍 Distância:', element.distance.text);
                console.log('⏱️  Duração:', element.duration.text);
                console.log('\n✅ A chave da API está funcionando corretamente!');
            } else {
                console.log('⚠️  Status do elemento:', element.status);
            }
        } else {
            console.error('❌ Status não OK:', response.data.status);
            console.error('Mensagem:', response.data.error_message);
        }

    } catch (error: any) {
        console.error('\n❌ ERRO ao testar a API:\n');

        if (error.response) {
            console.error('Status HTTP:', error.response.status);
            console.error('Dados do erro:', JSON.stringify(error.response.data, null, 2));

            if (error.response.status === 403) {
                console.error('\n📋 DIAGNÓSTICO - Erro 403:');
                console.error('  1. Verifique se o Billing está ativado no Google Cloud Console');
                console.error('  2. Verifique se a "Distance Matrix API" está habilitada');
                console.error('  3. Verifique se há restrições de IP/domínio na chave');
                console.error('  4. Link: https://console.cloud.google.com/apis/credentials');
            } else if (error.response.status === 401) {
                console.error('\n📋 DIAGNÓSTICO - Erro 401:');
                console.error('  1. A chave da API está incorreta ou inválida');
                console.error('  2. Verifique se copiou a chave completa no .env');
            }
        } else {
            console.error('Mensagem:', error.message);
        }

        process.exit(1);
    }
}

testGoogleMapsKey();
