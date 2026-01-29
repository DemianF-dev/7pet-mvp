import dotenv from 'dotenv';
dotenv.config();

// 🔒 SECURITY: Validate critical environment variables at startup
// Security: Removed sensitive environment variable logging
import { validateEnvironment } from './utils/envValidation';
import logger, { logInfo, logWarn, logError } from './utils/logger';

try {
    validateEnvironment();
} catch (error: any) {
    logger.error('Startup Warning: Environment validation failed!');
    // We do NOT exit here anymore so that the API can still start
    // and return proper JSON errors with CORS headers instead of crashing hard.
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
import brainRoutes from './routes/brainRoutes';

import { startNotificationScheduler } from './services/notificationService'; // **NOVO**
import { errorHandler } from './middlewares/errorMiddleware';
import { auditContextMiddleware } from './middlewares/auditContext';
import { authenticate, authorize } from './middlewares/authMiddleware';


// 📊 MONITORING SYSTEM
import { metricsMiddleware } from './middlewares/metricsMiddleware';
import { metricsService } from './services/metricsService';
import metricsRoutes from './routes/metricsRoutes';

import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.io
socketService.initialize(httpServer);

// 🚨 EMERGENCY ROUTES (Temporary for debugging) - Start
app.get('/emergency/users', async (req, res) => {
    if (req.query.secret !== '7pet-rescue') return res.status(403).json({ error: 'Forbiddem' });
    const dbUrl = process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@');
    try {
        // ... (rest of logic)

        // Test 1: Connectivity
        let connectivity = 'OK';
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch (e: any) {
            connectivity = `FAILED: ${e.message}`;
            throw new Error(`DB Connection Failed: ${e.message}`);
        }

        // Test 1.5: Raw User Query
        let rawUserCheck = 'OK';
        let rawUsers: any = [];
        try {
            rawUsers = await prisma.$queryRaw`SELECT * FROM "User" LIMIT 5`;
        } catch (e: any) {
            rawUserCheck = `FAILED: ${e.message}`;
        }

        // Test 2: Table Access (Prisma)
        let prismaUsers: any = [];
        try {
            prismaUsers = await prisma.user.findMany({
                take: 50,
                select: { id: true, email: true, role: true, division: true, name: true, createdAt: true }
            });
        } catch (e: any) {
            // If prisma fails, we want to know, but maybe return rawUsers if available
            throw new Error(`Prisma FindMany Failed: ${e.message}`);
        }

        res.json({
            count: prismaUsers.length,
            status: 'DB Connection OK',
            connectivity,
            rawUserCheck,
            dbUrl,
            users: prismaUsers,
            rawUsers
        });
    } catch (e: any) {
        logError('Emergency DB Check Failed', e);
        res.status(500).json({ error: e.message, stack: e.stack, code: e.code, meta: e.meta, dbUrl });
    }
});

app.post('/emergency/create-master', async (req, res) => {
    if (req.query.secret !== '7pet-rescue') return res.status(403).json({ error: 'Forbiddem' });
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Missing email/password' });

        const hashedPassword = await bcrypt.hash(password, 10);

        let user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            const updated = await prisma.user.update({
                where: { email },
                data: { role: 'MASTER', division: 'MASTER', passwordHash: hashedPassword }
            });
            res.json({ message: 'Updated existing user to MASTER', user: updated });
        } else {
            const created = await prisma.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    role: 'MASTER',
                    division: 'MASTER',
                    name: 'Master User',
                    customer: { create: { name: 'Master User' } }
                }
            });
            res.json({ message: 'Created new MASTER user', user: created });
        }
    } catch (e: any) {
        logError('Emergency Create Master Failed', e);
        res.status(500).json({ error: e.message });
    }
});
// 🚨 EMERGENCY ROUTES - End

// 🛡️ TRUST PROXY: Needed for Vercel/proxies to get the real client IP
app.set('trust proxy', 1);

// Security: Moved to granular rate limiters in utils/rateLimiters.ts

// 🌐 CORS configuration - MUST be the first middleware
const allowedOrigins = [
    'https://my7.pet',
    'https://www.my7.pet',
    'https://7pet-mvp.vercel.app',
    'https://7pet-backend.vercel.app',
    'https://7pet-app.vercel.app', // Added common Vercel default
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
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);

        // Standardize origin (remove trailing slash)
        const sanitizedOrigin = origin.replace(/\/$/, "");

        // Allow all specified origins
        if (allowedOrigins.indexOf(sanitizedOrigin) !== -1 || (isDev && localIpRegex.test(sanitizedOrigin))) {
            callback(null, true);
        } else {
            // Log the blocked attempt for debugging
            logWarn('CORS blocked request', {
                origin: sanitizedOrigin,
                allowedOrigins
            });
            logger.warn(`CORS blocked request from origin: ${sanitizedOrigin}`);
            metricsService.incrementBlockedCORS(); // 📊 Track CORS blocks
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'sentry-trace', 'baggage'],
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// 🛡️ Pre-flight CORS for all routes (Manual fallback for Vercel/proxies)
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
    // Security Headers Configuration
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Required for Tailwind CSS
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"], // Allow images and data URIs
            connectSrc: ["'self'", "https://api.google.com", "wss:"], // For APIs and WebSocket
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    } : false, // Disable HSTS in development
    crossOriginEmbedderPolicy: false, // Required for Vite dev mode
}));
app.use(compression());
app.use(generalLimiter); // 🛡️ General rate limiting enabled for security

// 📊 MONITORING - Capture all requests (must be before other middlewares)
app.use(metricsMiddleware);

app.get('/heartbeat', (req, res) => res.json({ status: 'live', time: new Date().toISOString() }));

app.use((req, res, next) => {
    // Security: Removed detailed request logging - use proper logging instead
    next();
});

// CORS moved to top
app.use(express.json({ limit: '10mb' }));

// 📊 MONITORING Dashboard - Serve static files
app.use(express.static('public'));

// 1. Strip /api prefix if present (Must be FIRST to normalize paths for all other middlewares)
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

// 2. Apply Audit Context (Must be after normalization and before routes)
// Note: req.user is populated by authenticate middleware inside routes, 
// so we'll apply this globally but it will only find req.user if placed after auth.
// However, the prompt says "apply auditContext after auth parsing".
app.use(auditContextMiddleware);


// NOTE: helmet(), compression(), and express.json() are already applied above (lines 69-70, 119)

app.use('/pos', posRoutes); // Moved to top for priority
app.use('/system-auth', authRoutes);
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
app.use('/metrics', metricsRoutes); // Metrics endpoint
app.use('/cron', cronRoutes);
app.use('/feed', feedRoutes);
app.use('/chat', chatRoutes);
app.use('/hr', hrRoutes);
app.use('/time-tracking', timeTrackingRoutes);
app.use('/marketing', marketingRoutes);
app.use('/packages', packageRoutes);
app.use('/recurrence', recurrenceRoutes);
app.use('/dev', devRoutes); // MASTER-only developer tools
app.use('/brain', brainRoutes);

// Start notification scheduler (dev only, Vercel uses Cron Jobs)
// TEMPORARILY DISABLED to prevent DB timeout errors
// startNotificationScheduler();

app.get('/', (req, res) => {
    logInfo('Health check triggered');
    res.send('🚀 7Pet API está Ativa!');
});

// Hardcoded version for stability during transition
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
    // 🛡️ Security: Only return keys, never values
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

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for mobile access
    httpServer.listen(Number(PORT), HOST, () => {
        logger.info(`🚀 Server running on ${HOST}:${PORT}`);
        logger.info(`📊 Monitoring dashboard: http://localhost:${PORT}/dashboard.html`);
    });
}

export default app;