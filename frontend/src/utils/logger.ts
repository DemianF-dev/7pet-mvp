// Frontend Logger - Security Hardening
// Only logs errors in production, no sensitive data

const isDevelopment = import.meta.env.DEV;

const logger = {
  error: (message: string, data?: any) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, data);
    } else {
      // In production, only log to error tracking service
      // Never log sensitive data to console
      console.error(`[ERROR] ${message}`);
    }
  },
  
  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, data);
    }
    // No warnings in production
  },
  
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, data);
    }
    // No info logs in production
  },
  
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data);
    }
    // No debug logs in production
  }
};

export default logger;