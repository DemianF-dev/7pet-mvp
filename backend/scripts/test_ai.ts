
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import dotenv from 'dotenv';
dotenv.config();

async function testBrain() {
    console.log('Testing Brain/AI integration...');
    console.log('Key present:', !!process.env.OPENAI_API_KEY);

    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ NO API KEY');
        return;
    }

    try {
        const result = await streamText({
            model: openai('gpt-4o-mini'),
            messages: [{ role: 'user', content: 'Say "AI IS WORKING"' }],
            maxSteps: 1
        });

        let fullText = '';
        for await (const textPart of result.textStream) {
            fullText += textPart;
        }

        console.log('✅ AI Response:', fullText);
    } catch (e) {
        console.error('❌ AI Failed:', e.message);
        console.error(e);
    }
}

testBrain();
