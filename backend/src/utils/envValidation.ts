/**
 * Environment Validation Utility
 * Valida variáveis de ambiente críticas ao startup da aplicação
 * Implementado seguindo auditoria de segurança (04/01/2026)
 */

interface EnvValidationRule {
    key: string;
    required: boolean;
    minLength?: number;
    pattern?: RegExp;
    errorMessage?: string;
}

const CRITICAL_ENV_VARS: EnvValidationRule[] = [
    {
        key: 'JWT_SECRET',
        required: true,
        minLength: 32,
        errorMessage: 'JWT_SECRET must be at least 32 characters long for security'
    },
    {
        key: 'DATABASE_URL',
        required: true,
        pattern: /^postgres(ql)?:\/\//,
        errorMessage: 'DATABASE_URL must be a valid PostgreSQL connection string'
    },

    {
        key: 'GOOGLE_MAPS_API_KEY',
        required: false,
        minLength: 20,
        errorMessage: 'GOOGLE_MAPS_API_KEY must be configured'
    },
    {
        key: 'NODE_ENV',
        required: false
    }
];


/**
 * Valida todas as variáveis de ambiente críticas
 * @throws Error se alguma validação falhar
 */
export function validateEnvironment(): void {
    const errors: string[] = [];

    for (const rule of CRITICAL_ENV_VARS) {
        const value = process.env[rule.key];

        // Verificar se é obrigatória
        if (rule.required && !value) {
            errors.push(`❌ Missing required environment variable: ${rule.key}`);
            continue;
        }

        // Se não existe e não é obrigatória, pular
        if (!value) continue;

        // Verificar tamanho mínimo
        if (rule.minLength && value.length < rule.minLength) {
            errors.push(
                rule.errorMessage ||
                `❌ ${rule.key} must be at least ${rule.minLength} characters long (current: ${value.length})`
            );
        }

        // Verificar padrão regex
        if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(
                rule.errorMessage ||
                `❌ ${rule.key} does not match required pattern`
            );
        }
    }

    // Se houver erros, lançar exceção e impedir startup
    if (errors.length > 0) {
        console.error('\n🚨 FATAL: Environment validation failed!\n');
        errors.forEach(error => console.error(error));
        console.error('\n⚠️  Application cannot start with invalid environment configuration.\n');
        throw new Error('Environment validation failed');
    }

    console.log('✅ Environment validation passed');
}

/**
 * Sanitiza uma URL removendo tokens e secrets
 * Útil para prevenir vazamento de credenciais em logs
 */
export function sanitizeUrl(url: string): string {
    return url
        .replace(/([?&]token=)[^&]+/g, '$1***')
        .replace(/([?&]api[_-]?key=)[^&]+/gi, '$1***')
        .replace(/([?&]secret=)[^&]+/gi, '$1***')
        .replace(/([?&]password=)[^&]+/gi, '$1***');
}

/**
 * Sanitiza headers HTTP removendo informações sensíveis
 * Útil para prevenir vazamento de credenciais em logs
 */
export function sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };

    if (sanitized.authorization) {
        sanitized.authorization = sanitized.authorization.replace(/Bearer .+/, 'Bearer ***');
    }

    if (sanitized['x-api-key']) {
        sanitized['x-api-key'] = '***';
    }

    if (sanitized.cookie) {
        sanitized.cookie = '***';
    }

    return sanitized;
}

/**
 * Gera um JWT_SECRET seguro
 * Útil para desenvolvimento ou scripts de setup
 */
export function generateSecureSecret(length: number = 48): string {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('base64');
}
