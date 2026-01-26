import { Request, Response } from 'express';
import multer from 'multer';
import { storageService } from '../services/storageService';
import { logInfo, logError } from '../utils/logger';
import path from 'path';

// Multer config: memory storage is better for direct upload to Supabase
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

export const uploadMiddleware = upload.single('file');

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const file = req.file;
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.originalname.replace(/\s+/g, '_')}`;
        const filePath = `chat/${fileName}`;

        const publicUrl = await storageService.uploadFile(
            'attachments', // Bucket name
            filePath,
            file.buffer,
            file.mimetype
        );

        res.json({
            url: publicUrl,
            fileName: file.originalname,
            fileType: file.mimetype
        });
    } catch (error) {
        logError('Error in uploadFile controller', error);
        res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
    }
};
