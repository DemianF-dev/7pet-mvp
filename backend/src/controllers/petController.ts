import { Response } from 'express';
import * as petService from '../services/petService';
import { z } from 'zod';

const petSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    species: z.string().min(1, 'Espécie é obrigatória'),
    breed: z.string().nullish(),
    weight: z.number().nullish(),
    observations: z.string().nullish(),
    coatType: z.string().nullish(),
    usesPerfume: z.boolean().optional(), // boolean checkboxes usually undefined if false, or explicit true/false
    usesOrnaments: z.boolean().optional(),
    temperament: z.string().nullish(),
    age: z.string().nullish(),
    healthIssues: z.string().nullish(),
    allergies: z.string().nullish(),
    hasKnots: z.boolean().optional(),
    hasMattedFur: z.boolean().optional(),
    preferences: z.string().optional(),
    customerId: z.string().uuid().optional(), // Optional for staff to specify

    // Migration fields from Bitrix24
    sex: z.string().optional().nullable(),
    size: z.string().optional().nullable(),
    birthDate: z.string().optional().nullable(),
    hasSpecialNeeds: z.boolean().optional().nullable(),
    specialNeedsDescription: z.string().optional().nullable(),
    isCastrated: z.boolean().optional().nullable(),
    hasOwnTrousseau: z.boolean().optional().nullable(),
    favoriteToy: z.string().optional().nullable(),
    habits: z.string().optional().nullable(),
    nightHabits: z.string().optional().nullable(),
    feedingType: z.string().optional().nullable(),
    allowsTreats: z.boolean().optional().nullable(),
    socialWithAnimals: z.boolean().optional().nullable(),
    socialWithHumans: z.boolean().optional().nullable(),
    walkingFrequency: z.string().optional().nullable(),
    authorityCommand: z.string().optional().nullable(),
    takesMedication: z.boolean().optional().nullable(),
    medicationDetails: z.string().optional().nullable(),
    medicationAllergies: z.string().optional().nullable(),
    parasiteControlUpToDate: z.boolean().optional().nullable(),
    vaccinesUpToDate: z.boolean().optional().nullable(),
    knowsHotelOrDaycare: z.boolean().optional().nullable(),
    usedToBeingAway: z.boolean().optional().nullable(),
    timeWithPet: z.string().optional().nullable(),
    relationshipOrigin: z.string().optional().nullable(),
    handlingPreference: z.string().optional().nullable(),
    photoUrl: z.string().optional().nullable(),
}).passthrough();

export const create = async (req: any, res: Response) => {
    try {
        console.log('RECEBENDO PET:', JSON.stringify(req.body));
        const data = petSchema.parse(req.body);

        // If client, force their own customerId
        if (req.user.role === 'CLIENTE') {
            data.customerId = req.user.customer.id;
        } else if (!data.customerId) {
            return res.status(400).json({ error: 'customerId é obrigatório para colaboradores' });
        }

        // Convert dates
        if (data.birthDate) {
            (data as any).birthDate = new Date(data.birthDate);
        }

        const pet = await petService.create(data);
        console.log('Pet criado com sucesso:', pet.id);
        res.status(201).json(pet);
    } catch (error: any) {
        console.error('ERRO AO CRIAR PET:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
};

export const list = async (req: any, res: Response) => {
    try {
        let { customerId } = req.query;

        // If client, always force their own customerId
        if (req.user.role === 'CLIENTE') {
            customerId = req.user.customer.id;
        }

        const pets = await petService.list(customerId as string);
        res.json(pets);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const get = async (req: any, res: Response) => {
    try {
        const pet = await petService.get(req.params.id);
        if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });

        // Security: Clients can only see their own pets
        if (req.user.role === 'CLIENTE' && pet.customerId !== req.user.customer.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        res.json(pet);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const update = async (req: any, res: Response) => {
    try {
        const pet = await petService.get(req.params.id);
        if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });

        // Security: Clients can only update their own pets
        if (req.user.role === 'CLIENTE' && pet.customerId !== req.user.customer.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const data = petSchema.partial().parse(req.body);

        // Convert dates
        if (data.birthDate) {
            (data as any).birthDate = new Date(data.birthDate);
        }

        const updatedPet = await petService.update(req.params.id, data);
        res.json(updatedPet);
    } catch (error: any) {
        console.error('ERRO AO ATUALIZAR PET:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
};

export const remove = async (req: any, res: Response) => {
    try {
        const pet = await petService.get(req.params.id);
        if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });

        // Security: Clients can only remove their own pets
        if (req.user.role === 'CLIENTE' && pet.customerId !== req.user.customer.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        await petService.remove(req.params.id);
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
