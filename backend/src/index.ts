import dotenv from 'dotenv';
dotenv.config();

// 🔒 SECURITY: Validate critical environment variables at startup
import { validateEnvironment } from './utils/envValidation';
/*
try {
    validateEnvironment();
} catch (error) {
    console.error('⚠️ Startup Warning: Environment validation failed, but continuing for diagnostics...');
}
*/

import express from 'express';
import { createServer } from 'http';
import { socketService } from './services/socketService';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import petRoutes from './routes/petRoutes';
import serviceRoutes from './routes/serviceRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import quoteRoutes from './routes/quoteRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import staffRoutes from './routes/staffRoutes';
import managementRoutes from './routes/managementRoutes';
import productRoutes from './routes/productRoutes';
import supportRoutes from './routes/supportRoutes';
import mapsRoutes from './routes/mapsRoutes';
import transportSettingsRoute from './routes/transportSettingsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import notificationSettingsRoutes from './routes/notificationSettingsRoutes';
import cronRoutes from './routes/cronRoutes';
import feedRoutes from './routes/feedRoutes';
import chatRoutes from './routes/chatRoutes';
import hrRoutes from './routes/hrRoutes';

import { startNotificationScheduler } from './services/notificationService'; // **NOVO**
import { errorHandler } from './middlewares/errorMiddleware';

// 📊 MONITORING SYSTEM
import { metricsMiddleware } from './middlewares/metricsMiddleware';
import { metricsService } from './services/metricsService';
import metricsRoutes from './routes/metricsRoutes';

import prisma from './lib/prisma';
import Logger from './lib/logger';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.io
socketService.initialize(httpServer);

// 🛡️ TRUST PROXY: Needed for Vercel/proxies to get the real client IP
app.set('trust proxy', 1);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 300 : 1000, // Higher limit in dev
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});

app.use(helmet());
app.use(compression());
app.use(limiter); // 🛡️ Rate limiting enabled for security

// 📊 MONITORING - Capture all requests (must be before other middlewares)
app.use(metricsMiddleware);

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// CORS configuration - ONLY allow specific origins (security fix)
const allowedOrigins = [
    'https://my7.pet',
    'https://www.my7.pet',
    'https://7pet-mvp.vercel.app',
    'https://7pet-backend.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:5174'
];


// Em desenvolvimento, permitir IPs locais (192.168.x.x)
const isDev = process.env.NODE_ENV !== 'production';
const localIpRegex = /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/;

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);

        // Standardize origin (remove trailing slash)
        const sanitizedOrigin = origin.replace(/\/$/, "");

        if (allowedOrigins.indexOf(sanitizedOrigin) !== -1 || (isDev && localIpRegex.test(sanitizedOrigin))) {
            callback(null, true);
        } else {
            console.warn(`[CORS] ❌ Blocked request from: ${origin}`);
            Logger.warn(`CORS blocked request from origin: ${origin}`);
            metricsService.incrementBlockedCORS(); // 📊 Track CORS blocks
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json({ limit: '10mb' }));

// 📊 MONITORING Dashboard - Serve static files
app.use(express.static('public'));

// 1. Strip /api prefix if present (Must be FIRST to normalize paths for all other middlewares)
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        req.url = req.url.replace('/api', '');
    }
    next();
});

// NOTE: helmet(), compression(), and express.json() are already applied above (lines 69-70, 119)

app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);
app.use('/pets', petRoutes);
app.use('/services', serviceRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/quotes', quoteRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/staff', staffRoutes);
app.use('/management', managementRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/notifications', notificationRoutes);
app.use('/notification-settings', notificationSettingsRoutes);
app.use('/products', productRoutes);
app.use('/support', supportRoutes);
app.use('/maps', mapsRoutes);
app.use('/transport-settings', transportSettingsRoute);
app.use('/metrics', metricsRoutes); // Metrics endpoint
app.use('/cron', cronRoutes);
app.use('/feed', feedRoutes);
app.use('/chat', chatRoutes);
app.use('/hr', hrRoutes);

// Start notification scheduler (dev only, Vercel uses Cron Jobs)
startNotificationScheduler();

app.get('/', (req, res) => {
    res.send('🚀 7Pet API está Ativa!');
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '0.1.0-beta',
        stage: 'production',
        timestamp: new Date().toISOString()
    });
});

app.get('/ping', (req, res) => {
    res.json({
        status: 'ok',
        message: 'pong',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
});

app.get('/diag', async (req, res) => {
    // 🛡️ Security: Only return keys, never values
    const envKeys = Object.keys(process.env).sort();
    const criticalKeys = ['DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET', 'GOOGLE_MAPS_API_KEY', 'GOOGLE_CLIENT_ID'];
    const missingKeys = criticalKeys.filter(key => !process.env[key]);

    let dbStatus = 'not_tested';
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (e) {
        dbStatus = 'error: ' + (e as Error).message;
    }

    res.json({
        status: 'diagnostic',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        allEnvKeys: envKeys,
        missingCriticalKeys: missingKeys,
        nodeVersion: process.version,
        platform: process.platform
    });
});


app.use(errorHandler);

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for mobile access
    httpServer.listen(Number(PORT), HOST, () => {
        Logger.info(`🚀 Server running on ${HOST}:${PORT}`);
        Logger.info(`📊 Monitoring dashboard: http://localhost:${PORT}/dashboard.html`);
    });
}

export default app;