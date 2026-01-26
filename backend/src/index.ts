import app, { httpServer } from './app';
import logger from './utils/logger';

const PORT = process.env.PORT || 3001;

// Only listen if NOT in Vercel environment (Vercel handles binding)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    const HOST = process.env.HOST || '0.0.0.0';
    httpServer.listen(Number(PORT), HOST, () => {
        logger.info(`🚀 Server running on ${HOST}:${PORT}`);
        logger.info(`📊 Monitoring dashboard: http://localhost:${PORT}/dashboard.html`);
    });
}

export default app;