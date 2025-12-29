import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

import notificationRoutes from './routes/notificationRoutes';
import { runNotificationScheduler } from './schedulers/notificationScheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: '*', // Allow all origins for MVP/Dev. In prod, lock this down.
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // This is a raw query to check if the column exists in the Customer table
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Customer'
        `;

        const hasSecondaryGuardian = columns.some((c: any) => c.column_name === 'secondaryGuardianName');

        res.json({
            database: 'postgresql',
            table: 'Customer',
            columns: columns.map((c: any) => c.column_name),
            hasSecondaryGuardian,
            timestamp: new Date()
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`⏱️  Notification scheduler started`);
});

export default app;
