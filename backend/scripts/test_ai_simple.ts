
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import dotenv from 'dotenv';
dotenv.config();

async function testBrainSimple() {
    console.log('Testing Brain/AI (Simple)...');
    console.log('Key:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');

    try {
        const result = await generateText({
            model: openai('gpt-4o-mini'),
            messages: [{ role: 'user', content: 'Say "OFFLINE TEST"' }],
        });

        console.log('✅ AI Response:', result.text);
    } catch (e: any) {
        console.error('❌ AI Failed:', e.message);
        if (e.cause) {
            console.error('Cause:', e.cause);
        }
        if (e.response) {
            console.error('Response Status:', e.response.status);
            console.error('Response Body:', await e.response.text());
        }
    }
}

testBrainSimple();
