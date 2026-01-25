import { UserFormData, ValidationResult } from '../types';

/**
 * Form validation utilities for User Management module
 */

/**
 * Validation rules
 */
export interface ValidationRule {
    field: string;
    label: string;
    required?: boolean;
    minLength?: number;
    pattern?: RegExp;
    validate?: (value: any, formData: UserFormData) => string | null;
}

/**
 * Email validation regex
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone validation regex (Brazilian format)
 */
export const PHONE_REGEX = /^(\d{10,11})$/;

/**
 * Document validation regex (CPF/CNPJ)
 */
export const DOCUMENT_REGEX = /^(\d{11}|\d{14})$/;

/**
 * Password validation regex
 */
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;

/**
 * Core validation functions
 */

/**
 * Validate email format
 */
export const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
        return 'E-mail é obrigatório';
    }
    
    if (!EMAIL_REGEX.test(email)) {
        return 'E-mail inválido';
    }
    
    return null;
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) {
        return null; // Phone is optional
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!PHONE_REGEX.test(cleanPhone)) {
        return 'Telefone inválido';
    }
    
    return null;
};

/**
 * Validate document (CPF/CNPJ)
 */
export const validateDocument = (document: string): string | null => {
    if (!document.trim()) {
        return null; // Document is optional for some cases
    }
    
    const cleanDoc = document.replace(/\D/g, '');
    
    if (!DOCUMENT_REGEX.test(cleanDoc)) {
        return 'Documento inválido (CPF deve ter 11 dígitos ou CNPJ 14 dígitos)';
    }
    
    // Basic CPF validation (simplified)
    if (cleanDoc.length === 11) {
        const cpf = cleanDoc;
        let sum = 0;
        let remainder;
        
        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }
        
        remainder = (sum * 10) % 11;
        remainder = remainder === 10 || remainder === 11 ? 0 : remainder;
        
        if (remainder !== parseInt(cpf.substring(9, 10))) {
            return 'CPF inválido';
        }
        
        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }
        
        remainder = (sum * 10) % 11;
        remainder = remainder === 10 || remainder === 11 ? 0 : remainder;
        
        if (remainder !== parseInt(cpf.substring(10, 11))) {
            return 'CPF inválido';
        }
    }
    
    return null;
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string, isNewUser: boolean = true): string | null => {
    if (isNewUser && !password) {
        return 'Senha é obrigatória para novos usuários';
    }
    
    if (password && password.length < 6) {
        return 'Senha deve ter pelo menos 6 caracteres';
    }
    
    if (password && !PASSWORD_REGEX.test(password)) {
        return 'Senha deve conter pelo menos uma letra e um número';
    }
    
    return null;
};

/**
 * Validate names
 */
export const validateName = (firstName: string, lastName: string, name: string): string | null => {
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || name.trim();
    
    if (!fullName) {
        return 'Nome é obrigatório';
    }
    
    if (fullName.length < 2) {
        return 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (/[^a-zA-Z\s]/.test(fullName)) {
        return 'Nome deve conter apenas letras e espaços';
    }
    
    return null;
};

/**
 * Validate birth date
 */
export const validateBirthDate = (birthDate: string): string | null => {
    if (!birthDate) {
        return null; // Birth date is optional
    }
    
    const date = new Date(birthDate);
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    
    if (age < 16 || age > 120) {
        return 'Idade deve estar entre 16 e 120 anos';
    }
    
    return null;
};

/**
 * Validate admission date
 */
export const validateAdmissionDate = (admissionDate: string): string | null => {
    if (!admissionDate) {
        return null; // Admission date is optional
    }
    
    const date = new Date(admissionDate);
    const now = new Date();
    
    if (date > now) {
        return 'Data de admissão não pode ser no futuro';
    }
    
    // Check if admission date is not too old (more than 50 years)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 50);
    
    if (date < maxDate) {
        return 'Data de admissão muito antiga';
    }
    
    return null;
};

/**
 * Validate user permissions
 */
export const validatePermissions = (permissions: string[], division: string): string | null => {
    // Client users typically don't need permissions
    if (division === 'CLIENTE') {
        if (permissions.length > 0) {
            return 'Clientes não devem ter permissões específicas';
        }
        return null;
    }
    
    // Staff users should have at least some basic permissions
    if (division !== 'CLIENTE' && permissions.length === 0) {
        return 'Colaboradores devem ter pelo menos uma permissão';
    }
    
    return null;
};

/**
 * Validate customer data for client users
 */
export const validateCustomerData = (customer: any): string | null => {
    if (!customer) return null;
    
    const errors: string[] = [];
    
    if (customer.riskLevel && !['Nivel 1', 'Nivel 2', 'Nivel 3'].includes(customer.riskLevel)) {
        errors.push('Nível de classificação inválido');
    }
    
    if (errors.length > 0) {
        return errors.join(', ');
    }
    
    return null;
};

/**
 * Complete form validation
 */
export const validateUserForm = (formData: UserFormData): ValidationResult => {
    const errors: string[] = [];
    
    // Basic info validation
    const nameError = validateName(formData.firstName, formData.lastName, formData.name);
    if (nameError) errors.push(nameError);
    
    const emailError = validateEmail(formData.email);
    if (emailError) errors.push(emailError);
    
    const phoneError = validatePhone(formData.phone);
    if (phoneError) errors.push(phoneError);
    
    // Division and role validation
    if (!formData.division) {
        errors.push('Divisão é obrigatória');
    }
    
    if (!formData.role) {
        errors.push('Cargo é obrigatório');
    }
    
    // Document validation for staff
    if (formData.division !== 'CLIENTE') {
        const docError = validateDocument(formData.document);
        if (docError) errors.push(docError);
        
        const birthDateError = validateBirthDate(formData.birthday);
        if (birthDateError) errors.push(birthDateError);
        
        const admissionDateError = validateAdmissionDate(formData.admissionDate);
        if (admissionDateError) errors.push(admissionDateError);
    }
    
    // Password validation
    const isNewUser = !formData.email.includes('@'); // Simplified check - in real implementation would use user ID
    const passwordError = validatePassword(formData.password, isNewUser);
    if (passwordError) errors.push(passwordError);
    
    // Permissions validation
    const permissionError = validatePermissions(formData.permissions, formData.division);
    if (permissionError) errors.push(permissionError);
    
    // Customer validation for clients
    if (formData.division === 'CLIENTE' && formData.customer) {
        const customerError = validateCustomerData(formData.customer);
        if (customerError) errors.push(customerError);
    }
    
    // Specific validations by division
    if (formData.division === 'CLIENTE') {
        if (!formData.name && !formData.customer?.name) {
            errors.push('Nome do cliente é obrigatório');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Real-time field validation
 */
export const validateField = (field: string, value: any, formData: UserFormData): string | null => {
    switch (field) {
        case 'email':
            return validateEmail(value);
        case 'phone':
            return validatePhone(value);
        case 'firstName':
        case 'lastName':
        case 'name':
            return validateName(formData.firstName, formData.lastName, formData.name);
        case 'password':
            return validatePassword(value);
        case 'document':
            return validateDocument(value);
        case 'birthday':
            return validateBirthDate(value);
        case 'admissionDate':
            return validateAdmissionDate(value);
        default:
            return null;
    }
};

/**
 * Check form has changes
 */
export const hasFormChanges = (originalData: UserFormData, currentData: UserFormData): boolean => {
    const keys = Object.keys(currentData) as (keyof UserFormData)[];
    
    return keys.some(key => {
        const originalValue = originalData[key];
        const currentValue = currentData[key];
        
        // Special handling for arrays
        if (Array.isArray(originalValue) && Array.isArray(currentValue)) {
            return JSON.stringify(originalValue) !== JSON.stringify(currentValue);
        }
        
        // Special handling for objects
        if (typeof originalValue === 'object' && typeof currentValue === 'object' && originalValue !== null && currentValue !== null) {
            return JSON.stringify(originalValue) !== JSON.stringify(currentValue);
        }
        
        return originalValue !== currentValue;
    });
};

/**
 * Sanitize form data
 */
export const sanitizeFormData = (formData: UserFormData): UserFormData => {
    return {
        ...formData,
        firstName: formData.firstName?.trim() || '',
        lastName: formData.lastName?.trim() || '',
        name: formData.name?.trim() || '',
        email: formData.email?.trim().toLowerCase() || '',
        phone: formData.phone?.replace(/\D/g, '') || '',
        document: formData.document?.replace(/\D/g, '') || '',
        notes: formData.notes?.trim() || '',
        address: formData.address?.trim() || ''
    };
};