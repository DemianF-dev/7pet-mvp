import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
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
import { runNotificationScheduler } from './schedulers/notificationScheduler';
import { errorHandler } from './middlewares/errorMiddleware';

import prisma from './lib/prisma';
import Logger from './lib/logger';

const app = express();
const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Limit each IP to 300 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});

// Security Middleware
app.use(helmet());
app.use(compression());
app.use(limiter);

// Request Logger Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});

// CORS Configuration
app.use(cors({
    origin: true, // Allow any origin that sends the request
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));

// Routes
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
app.use('/products', productRoutes);
app.use('/support', supportRoutes);
app.use('/maps', mapsRoutes);
app.use('/settings/transport', transportSettingsRoute);

// Start Scheduler
runNotificationScheduler();

app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #6366f1;">🚀 7Pet API está Ativa!</h1>
            <p style="color: #64748b;">O banco de dados Supabase foi conectado com sucesso.</p>
            <hr style="width: 100px; margin: 20px auto; border: 1px solid #e2e8f0;">
            <p style="font-size: 0.9rem; color: #94a3b8;">Status: <span style="color: #10b981; font-weight: bold;">ONLINE</span></p>
        </div>
    `);
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/diagnose-db', async (req, res) => {
    try {

        // Check for all expected tables
        const tables = [
            'User', 'Customer', 'Pet', 'Service', 'Appointment',
            'Quote', 'QuoteItem', 'Invoice', 'PaymentRecord',
            'Notification', 'AuditLog', 'RolePermission', 'BugReport'
        ];

        const diagResults: any = {
            database: 'postgresql',
            tables: {},
            timestamp: new Date()
        };

        for (const tableName of tables) {
            try {
                const count = await (prisma as any)[tableName.charAt(0).toLowerCase() + tableName.slice(1)].count();
                diagResults.tables[tableName] = { status: 'OK', count };
            } catch (err: any) {
                diagResults.tables[tableName] = { status: 'ERROR', message: err.message };
            }
        }

        res.json(diagResults);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        Logger.info(`🚀 Server running on http://localhost:${PORT}`);
        Logger.info(`⏱️  Notification scheduler started`);
    });
}

export default app;
