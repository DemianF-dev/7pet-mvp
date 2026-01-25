import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import * as supportController from '../controllers/supportController';

const router = Router();

router.use(authenticate);

router.post('/', supportController.createTicket);
router.get('/', supportController.listTickets);
router.patch('/:id/status', supportController.updateTicketStatus);

export default router;
