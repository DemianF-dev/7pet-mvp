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
router.post('/:id/calculate-transport', quoteController.calculateTransport);
router.post('/manual', quoteController.createManual);

// DEBUG ENDPOINT - REMOVER DEPOIS DE CORRIGIR
router.get('/debug-maps-config', (req, res) => {
    const apiKey = (process.env.GOOGLE_MAPS_API_KEY || '').trim();

    if (!apiKey) {
        return res.json({
            error: 'GOOGLE_MAPS_API_KEY não encontrada nas variáveis de ambiente',
            env: process.env.NODE_ENV,
            hasKey: false
        });
    }

    return res.json({
        hasKey: true,
        keyLength: apiKey.length,
        keyPrefix: apiKey.substring(0, 12) + '...',
        keySuffix: '...' + apiKey.substring(apiKey.length - 8),
        expectedLength: 39,
        isCorrectLength: apiKey.length === 39,
        env: process.env.NODE_ENV
    });
});

router.post('/:id/approve-and-schedule', quoteController.approveAndSchedule);

export default router;
