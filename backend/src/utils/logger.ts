import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  } : undefined,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
    // Redact sensitive fields
    user: (user: any) => {
      if (!user) return null;
      const { id, role, email, ...sensitive } = user;
      return { id, role, email: email?.substring(0, 3) + '***' };
    },
    body: (body: any) => {
      if (!body) return null;
      // Remove sensitive fields from request body
      const sanitized = { ...body };
      const sensitiveKeys = ['password', 'token', 'authorization', 'jwt', 'secret', 'key'];
      sensitiveKeys.forEach(key => delete sanitized[key]);
      return sanitized;
    }
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.jwt',
      'req.body.secret',
      'res.body.token',
      'user.email',
      'user.phone',
      'user.document'
    ],
    remove: true
  }
});

export default logger;

// Manual sanitizer for metadata objects
const sanitizeData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'password', 'passwordHash', 'token', 'secret', 'key',
    'authorization', 'cookie', 'session', 'jwt'
  ];

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const sanitized = { ...data };

  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });

  return sanitized;
};

// Convenience functions to match secureLogger API
export const logError = (message: string, error: any, meta?: any) => {
  logger.error({
    err: error instanceof Error ? error : { message: String(error) },
    ...sanitizeData(meta)
  }, message);
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(sanitizeData(meta), message);
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(sanitizeData(meta), message);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(sanitizeData(meta), message);
};

// Middleware for request logging
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
