
import dotenv from 'dotenv';
dotenv.config();

// 🔒 SECURITY: Validate critical environment variables at startup
import { validateEnvironment } from './utils/envValidation';
import logger, { logInfo, logWarn } from './utils/logger';

try {
    validateEnvironment();
} catch (error: any) {
    logger.error('Startup Warning: Environment validation failed!');
    console.error('Environment validation failed - check logs');
}

import express from 'express';
import { createServer } from 'http';
import { socketService } from './services/socketService';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { generalLimiter } from './utils/rateLimiters';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import petRoutes from './routes/petRoutes';
import serviceRoutes from './routes/serviceRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import quoteRoutes from './routes/quoteRoutes';
import auditRoutes from './routes/auditRoutes';
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
import appreciationRoutes from './routes/appreciationRoutes';
import cronRoutes from './routes/cronRoutes';
import feedRoutes from './routes/feedRoutes';
import chatRoutes from './routes/chatRoutes';
import hrRoutes from './routes/hrRoutes';
import timeTrackingRoutes from './routes/timeTrackingRoutes';
import marketingRoutes from './routes/marketingRoutes';
import goalRoutes from './routes/goalRoutes';
import packageRoutes from './routes/packageRoutes';
import devRoutes from './routes/devRoutes';
import posRoutes from './routes/posRoutes';
import recurrenceRoutes from './routes/recurrenceRoutes';

import { startNotificationScheduler } from './services/notificationService';
import { errorHandler } from './middlewares/errorMiddleware';
import { auditContextMiddleware } from './middlewares/auditContext';
import { authenticate, authorize } from './middlewares/authMiddleware';

// 📊 MONITORING SYSTEM
import { metricsMiddleware } from './middlewares/metricsMiddleware';
import { metricsService } from './services/metricsService';
import metricsRoutes from './routes/metricsRoutes';

import prisma from './lib/prisma';

const app = express();
export const httpServer = createServer(app);

// Initialize Socket.io
socketService.initialize(httpServer);

// 🛡️ TRUST PROXY: Needed for Vercel/proxies to get the real client IP
app.set('trust proxy', 1);

// 🌐 CORS configuration - MUST be the first middleware
const allowedOrigins = [
    'https://my7.pet',
    'https://www.my7.pet',
    'https://7pet-mvp.vercel.app',
    'https://7pet-backend.vercel.app',
    'https://7pet-app.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5174'
];

const isDev = process.env.NODE_ENV !== 'production';
const localIpRegex = /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/;

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const sanitizedOrigin = origin.replace(/\/$/, "");
        if (allowedOrigins.indexOf(sanitizedOrigin) !== -1 || (isDev && localIpRegex.test(sanitizedOrigin))) {
            callback(null, true);
        } else {
            logWarn('CORS blocked request', { origin: sanitizedOrigin, allowedOrigins });
            logger.warn(`CORS blocked request from origin: ${sanitizedOrigin}`);
            metricsService.incrementBlockedCORS();
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'sentry-trace', 'baggage'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.options('*', (req, res) => {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.includes(origin) || (isDev && localIpRegex.test(origin)))) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, sentry-trace, baggage');
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.sendStatus(200);
    }
    res.sendStatus(204);
});

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.google.com", "wss:"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    } : false,
    crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(generalLimiter);

app.use(metricsMiddleware);

app.get('/heartbeat', (req, res) => res.json({ status: 'live', time: new Date().toISOString() }));

app.use((req, res, next) => {
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

app.use((req, res, next) => {
    const originalUrl = req.url;
    if (req.url.startsWith('/api')) {
        req.url = req.url.replace('/api', '');
    }
    logInfo('HTTP request', {
        method: req.method,
        originalUrl,
        newUrl: req.url
    });
    next();
});

app.use(auditContextMiddleware);

app.use('/pos', posRoutes);
app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);
app.use('/quotes', quoteRoutes);
app.use('/pets', petRoutes);
app.use('/services', serviceRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/quotes', quoteRoutes);
app.use('/audit', auditRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/staff', staffRoutes);
app.use('/management', managementRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/goals', goalRoutes);
app.use('/notifications', notificationRoutes);
app.use('/notification-settings', notificationSettingsRoutes);
app.use('/appreciations', appreciationRoutes);
app.use('/products', productRoutes);
app.use('/support', supportRoutes);
app.use('/maps', mapsRoutes);
app.use('/transport-settings', transportSettingsRoute);
app.use('/metrics', metricsRoutes);
app.use('/cron', cronRoutes);
app.use('/feed', feedRoutes);
app.use('/chat', chatRoutes);
app.use('/hr', hrRoutes);
app.use('/time-tracking', timeTrackingRoutes);
app.use('/marketing', marketingRoutes);
app.use('/packages', packageRoutes);
app.use('/recurrence', recurrenceRoutes);
app.use('/dev', devRoutes);

startNotificationScheduler();

app.get('/', (req, res) => {
    logInfo('Health check triggered');
    res.send('🚀 7Pet API está Ativa!');
});

const versionInfo = {
    version: "BETA-20260125-MONO",
    timestamp: new Date().toISOString()
};

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        ...versionInfo,
        serverTime: new Date().toISOString()
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

app.get('/diag', authenticate, authorize(['MASTER']), async (req, res) => {
    const envKeys = Object.keys(process.env).sort();
    const criticalKeys = ['DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET', 'GOOGLE_MAPS_SERVER_KEY', 'GOOGLE_CLIENT_ID'];
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
        mapsServerKeyPresent: !!(process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY),
        mapsStage: (process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY) ? 'enabled' : 'disabled',
        nodeVersion: process.version,
        platform: process.platform
    });
});

app.use(errorHandler);

export default app;
