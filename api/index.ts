import dotenv from 'dotenv';
dotenv.config();

// Simple test without backend imports
export default function handler(req: any, res: any) {
  return res.status(200).json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    message: 'Simple health check - backend imports removed for debugging'
  });
}