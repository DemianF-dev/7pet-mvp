require('dotenv').config();
const { Client } = require("@googlemaps/google-maps-services-js");

async function testMaps() {
    console.log("Testing Maps API Key...");
    console.log("Key present?", !!process.env.GOOGLE_MAPS_API_KEY);
    console.log("Key start:", process.env.GOOGLE_MAPS_API_KEY ? process.env.GOOGLE_MAPS_API_KEY.substring(0, 5) : "NONE");

    const client = new Client({});

    try {
        const response = await client.distancematrix({
            params: {
                origins: ["Av. Paulista, 1000, SP"],
                destinations: ["Av. Faria Lima, 1000, SP"],
                key: process.env.GOOGLE_MAPS_API_KEY,
                language: 'pt-BR',
                mode: 'DRIVING',
                departure_time: 'now',
                traffic_model: 'pessimistic'
            }
        });

        console.log("Status:", response.data.status);
        if (response.data.error_message) {
            console.error("Error Message:", response.data.error_message);
        }
        console.log("Rows:", JSON.stringify(response.data.rows, null, 2));

    } catch (error) {
        console.error("Axios Error Status:", error.response ? error.response.status : "No status");
        console.error("Axios Error Data:", error.response ? error.response.data : error.message);
    }
}

testMaps();
