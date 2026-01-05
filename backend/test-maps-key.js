
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const key = process.env.GOOGLE_MAPS_API_KEY;

async function testKey() {
    if (!key) {
        console.error('❌ GOOGLE_MAPS_API_KEY not found in .env');
        return;
    }

    console.log(`Testing key: ${key.substring(0, 10)}...`);

    try {
        // Test Geocoding API (simplest)
        console.log('--- Testing Geocoding API ---');
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Osasco&key=${key}`;
        const geoResp = await axios.get(geoUrl);
        console.log('Geocoding Status:', geoResp.data.status);
        if (geoResp.data.error_message) console.log('Error Message:', geoResp.data.error_message);

        // Test Distance Matrix API (used in transport calculation)
        console.log('\n--- Testing Distance Matrix API ---');
        const dmUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=Osasco&destinations=Sao+Paulo&key=${key}`;
        const dmResp = await axios.get(dmUrl);
        console.log('Distance Matrix Status:', dmResp.data.status);
        if (dmResp.data.error_message) console.log('Error Message:', dmResp.data.error_message);

    } catch (err) {
        console.error('❌ Request failed:', err.message);
        if (err.response) {
            console.error('Status Code:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

testKey();
