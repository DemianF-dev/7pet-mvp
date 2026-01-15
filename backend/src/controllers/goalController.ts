import { Request, Response } from 'express';
import * as goalService from '../services/goalService';
import hrService from '../services/hrService';

export async function createGoal(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;
        const role = (req as any).user?.role;

        if (role !== 'MASTER' && role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Apenas Master/Admin podem criar metas.' });
        }

        const goal = await goalService.createGoal({
            ...req.body,
            createdBy: userId
        });

        res.status(201).json(goal);
    } catch (error: any) {
        console.error('Erro ao criar meta:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function updateGoal(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const role = (req as any).user?.role;

        if (role !== 'MASTER' && role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        const goal = await goalService.updateGoal(id, req.body);
        res.json(goal);
    } catch (error: any) {
        console.error('Erro ao atualizar meta:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function deleteGoal(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const role = (req as any).user?.role;

        if (role !== 'MASTER' && role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        await goalService.deleteGoal(id);
        res.status(204).send();
    } catch (error: any) {
        console.error('Erro ao deletar meta:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getGoals(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;
        const role = (req as any).user?.role;

        if (role === 'MASTER' || role === 'ADMIN') {
            const goals = await goalService.getAllGoals();
            return res.json(goals);
        }

        // For regular staff, get assigned/department goals
        const profile = await hrService.getStaffProfileByUserId(userId);
        if (!profile) {
            return res.json([]); // No profile, no goals
        }

        const goals = await goalService.getGoalsForStaff(profile.id, profile.department);
        res.json(goals);
    } catch (error: any) {
        console.error('Erro ao buscar metas:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function updateProgress(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { value } = req.body;
        const role = (req as any).user?.role;

        // Progress update might be restricted to Master/Admin or automated
        if (role !== 'MASTER' && role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        const goal = await goalService.updateProgress(id, value);
        res.json(goal);
    } catch (error: any) {
        console.error('Erro ao atualizar progresso:', error);
        res.status(500).json({ error: error.message });
    }
}
