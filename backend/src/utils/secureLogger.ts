import winston from 'winston';

// Configuração do logger centralizado
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: '7pet-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Sanitizador de dados sensíveis
const sanitizeData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password', 'passwordHash', 'token', 'secret', 'key', 
    'authorization', 'cookie', 'session', 'jwt'
  ];
  
  const sanitized = { ...data };
  
  // Sanitizar strings que podem conter dados sensíveis
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      // Verificar se contém patterns sensíveis
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    }
  });
  
  return sanitized;
};

// Funções de logging específicas
export const logError = (message: string, error: any, meta?: any) => {
  logger.error(message, {
    error: error.message || error,
    stack: error.stack,
    meta: sanitizeData(meta)
  });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, {
    meta: sanitizeData(meta)
  });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, {
    meta: sanitizeData(meta)
  });
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, {
    meta: sanitizeData(meta)
  });
};

// Middleware para logging de requests
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logInfo('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    });
  });
  
  next();
};

export default logger;