import { mapsService } from './src/services/mapsService';

async function testCalc() {
    try {
        const result = await mapsService.calculateTransportDetailed("Av. Hildebrando de Lima, 500");
        console.log('Result:', result);
    } catch (error) {
        console.error('Error Details:', error);
    }
}

testCalc();
