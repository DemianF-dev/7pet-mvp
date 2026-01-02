import { Router } from 'express';
import { productController } from '../controllers/productController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticate, productController.list);
router.post('/', authenticate, authorize(['GESTAO', 'ADMIN', 'MASTER']), productController.create);
router.patch('/:id', authenticate, authorize(['GESTAO', 'ADMIN', 'MASTER']), productController.update);
router.delete('/:id', authenticate, authorize(['GESTAO', 'ADMIN', 'MASTER']), productController.delete);
router.post('/bulk-delete', authenticate, authorize(['GESTAO', 'ADMIN', 'MASTER']), productController.bulkDelete);

// Trash system routes
router.get('/trash', authenticate, authorize(['GESTAO', 'ADMIN', 'MASTER']), productController.listTrash);
router.post('/bulk-restore', authenticate, authorize(['GESTAO', 'ADMIN', 'MASTER']), productController.bulkRestore);
router.patch('/:id/restore', authenticate, authorize(['GESTAO', 'ADMIN', 'MASTER']), productController.restore);
router.delete('/:id/permanent', authenticate, authorize(['GESTAO', 'ADMIN', 'MASTER']), productController.permanentRemove);

export default router;
