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

app.use(cors());
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

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`⏱️  Notification scheduler started`);
});

export default app;
