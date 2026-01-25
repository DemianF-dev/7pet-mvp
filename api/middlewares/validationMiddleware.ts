import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { loginSchema, createCustomerSchema, createPetSchema, createAppointmentSchema, createQuoteSchema } from '../utils/validationSchemas';

// Middleware factory para validação
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar body, params e query dependendo do schema
      const dataToValidate = {
        ...req.body,
        ...req.params,
        ...req.query
      };
      
      const validatedData = schema.parse(dataToValidate);
      
      // Substituir req.body com dados validados (se houver)
      if (Object.keys(req.body).length > 0) {
        req.body = validatedData;
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      return res.status(500).json({
        error: 'Erro de validação',
        message: 'Ocorreu um erro durante a validação dos dados'
      });
    }
  };
};

// Middleware específico para login
export const validateLogin = validate(loginSchema);

// Middleware específico para criação de cliente
export const validateCreateCustomer = validate(createCustomerSchema);

// Middleware específico para criação de pet
export const validateCreatePet = validate(createPetSchema);

// Middleware específico para criação de appointment
export const validateCreateAppointment = validate(createAppointmentSchema);

// Middleware específico para criação de quote
export const validateCreateQuote = validate(createQuoteSchema);