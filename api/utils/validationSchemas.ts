import { z } from 'zod';

// Schema para validação de login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

// Schema para validação de criação de cliente
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional(),
  address: z.string().optional(),
  type: z.enum(['AVULSO', 'MENSALISTA']).default('AVULSO'),
  userId: z.string().uuid('ID de usuário inválido')
});

// Schema para validação de criação de pet
export const createPetSchema = z.object({
  name: z.string().min(1, 'Nome do pet é obrigatório'),
  species: z.string().min(1, 'Espécie é obrigatória'),
  breed: z.string().optional(),
  weight: z.number().positive('Peso deve ser positivo').optional(),
  customerId: z.string().uuid('ID de cliente inválido')
});

// Schema para validação de appointment
export const createAppointmentSchema = z.object({
  customerId: z.string().uuid('ID de cliente inválido'),
  petId: z.string().uuid('ID de pet inválido'),
  startAt: z.string().datetime('Data/hora inválida'),
  category: z.enum(['SPA', 'LOGISTICA']).default('SPA'),
  performerId: z.string().uuid().optional()
});

// Schema para validação de quote
export const createQuoteSchema = z.object({
  customerId: z.string().uuid('ID de cliente inválido'),
  petId: z.string().uuid('ID de pet inválido').optional(),
  type: z.enum(['SPA', 'TRANSPORTE', 'SPA_TRANSPORTE']).default('SPA'),
  totalAmount: z.number().min(0, 'Valor total deve ser positivo'),
  desiredAt: z.string().datetime().optional()
});

// Tipos inferidos dos schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreatePetInput = z.infer<typeof createPetSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;