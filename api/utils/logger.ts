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