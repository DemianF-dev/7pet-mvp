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
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});

app.use(helmet());
app.use(compression());
app.use(limiter);

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));

// Strip /api prefix if present (Vercel monorepo routing support)
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        req.url = req.url.replace('/api', '');
    }
    next();
});

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

runNotificationScheduler();

app.get('/', (req, res) => {
    res.send('🚀 7Pet API está Ativa!');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        Logger.info(`🚀 Server running on port ${PORT}`);
    });
}

export default app;