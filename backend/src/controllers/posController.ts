
import { Request, Response } from 'express';
import * as posService from '../services/posService';
import { logInfo, logError } from '../utils/logger';

export const getActiveSession = async (req: Request, res: Response) => {
    try {
        const session = await posService.getActiveCashSession();
        res.json(session);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const openSession = async (req: any, res: Response) => {
    try {
        const { openingBalance, notes } = req.body;
        const session = await posService.openCashSession({
            openedById: req.user.id,
            openingBalance,
            notes
        });
        res.status(201).json(session);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const closeSession = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { closingBalance, notes } = req.body;
        const session = await posService.closeCashSession(id, {
            closedById: req.user.id,
            closingBalance,
            notes
        });
        res.json(session);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const createOrder = async (req: Request, res: Response) => {
    try {
        const order = await posService.createOrder(req.body);
        res.status(201).json(order);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const addPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { payments } = req.body;
        const order = await posService.addPayment(id, payments);
        res.json(order);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const order = await posService.getOrderDetails(id);
        if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
        res.json(order);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const cancelOrder = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const order = await posService.cancelOrder(id, reason, req.user.id);
        logInfo('POS Order Cancelled', { orderId: id, reason, user: req.user.email });
        res.json(order);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const searchItems = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        const queryString = (q as string) || '';
        logInfo('POS Controller starting search', { queryString });

        const results = await posService.searchPOSItems(queryString);

        logInfo('POS Controller search completed', {
            productsCount: results.products.length,
            servicesCount: results.services.length
        });
        res.json(results);
    } catch (error: any) {
        logError('POS Controller search error', error, { action: 'searchItems' });
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};

export const getAppointmentCheckout = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = await posService.getCheckoutDataFromAppointment(id);
        res.json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const listRecentOrders = async (req: Request, res: Response) => {
    try {
        const orders = await posService.listRecentOrders();
        res.json(orders);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};