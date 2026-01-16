import { mapsService } from './src/services/mapsService';

async function testCalcBad() {
    try {
        console.log('Testing with INVALID address...');
        const result = await mapsService.calculateTransportDetailed("Endereço Inexistente XYZ 12345 Marte");
        console.log('Result:', result);
    } catch (error: any) {
        console.error('Caught Expected Error:', error.message);
    }
}

testCalcBad();
