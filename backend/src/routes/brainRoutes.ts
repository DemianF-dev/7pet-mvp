
import { Router } from 'express';
import { handleChat } from '../controllers/BrainController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Only ADMIN and MASTER can access the brain
// Using authorize([]) which implies checking user role against allowed list, 
// but wait, authorize implementation checks: 
// if (userDivision === 'ADMIN' || userDivision === 'MASTER') return next();
// if (!divisions.includes(userDivision)) return 403;
// So passing [] (empty) means ONLY Admin/Master can pass (because no other role is in the empty list).
router.post('/chat', authenticate, authorize([]), handleChat);

export default router;
