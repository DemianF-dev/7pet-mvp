// Debug wrapper for Vercel
console.log('[API] Starting function initialization...');

let app: any;

try {
    // Determine path based on environment
    console.log('[API] Importing backend app...');
    // We use require to catch import errors (like missing modules)
    const backend = require('../backend/src/index');
    app = backend.default || backend;
    console.log('[API] Backend app imported successfully.');
} catch (error: any) {
    console.error('[API] CRITICAL: Failed to import backend app:', error);
    // Fallback app to prevent FUNCTION_INVOCATION_FAILED
    const express = require('express');
    app = express();
    app.all('*', (req: any, res: any) => {
        res.status(500).json({
            error: 'Backend Initialization Failed',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    });
}

export default app;