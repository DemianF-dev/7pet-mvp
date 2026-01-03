import winston from 'winston';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info: any) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Only use Console transport (Vercel doesn't allow file writes)
const transports = [
    new winston.transports.Console(),
    // File transports disabled for Vercel compatibility
    // ...(process.env.NODE_ENV !== 'production' ? [
    //     new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    //     new winston.transports.File({ filename: 'logs/all.log' })
    // ] : [])
];

const Logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    levels,
    format,
    transports,
});

export default Logger;
