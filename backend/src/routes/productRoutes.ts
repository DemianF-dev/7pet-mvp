import { Router } from 'express';
import { productController } from '../controllers/productController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticate, productController.list);
router.post('/', authenticate, authorize(['GESTAO', 'ADMIN', 'MASTER']), productController.create);
router.patch('/:id', authenticate, authorize(['GESTAO', 'ADMIN', 'MASTER']), productController.update);
router.delete('/:id', authenticate, authorize(['GESTAO', 'ADMIN', 'MASTER']), productController.delete);
router.post('/bulk-delete', authenticate, authorize(['GESTAO', 'ADMIN', 'MASTER']), productController.bulkDelete);

export default router;
