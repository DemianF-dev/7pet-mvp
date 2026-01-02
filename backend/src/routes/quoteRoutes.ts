import { Router } from 'express';
import { quoteController } from '../controllers/quoteController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', quoteController.create);
router.get('/', quoteController.list);
router.get('/trash', quoteController.listTrash);
router.post('/bulk-delete', quoteController.bulkDelete);
router.get('/:id', quoteController.get);
router.post('/:id/duplicate', quoteController.duplicate);
router.patch('/:id', quoteController.update);
router.put('/:id', quoteController.update); // Alias for PATCH
router.patch('/:id/status', quoteController.updateStatus);
router.delete('/:id', quoteController.remove);
router.post('/:id/restore', quoteController.restore);
router.delete('/:id/permanent', quoteController.permanentRemove);

// Cascading delete routes
router.get('/:id/dependencies', quoteController.checkDependencies);
router.post('/:id/cascade-delete', quoteController.cascadeDelete);

export default router;
