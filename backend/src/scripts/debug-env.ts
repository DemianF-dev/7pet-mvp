
import dotenv from 'dotenv';
dotenv.config();
import { validateEnvironment } from '../utils/envValidation';

console.log('--- DEBUGGING ENV ---');
try {
    validateEnvironment();
    console.log('--- VALIDATION PASSED ---');
} catch (error) {
    console.error('--- VALIDATION FAILED ---');
    // Error detalis are already printed by validateEnvironment
}
