import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Environment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    return res.status(200).json({
      status: 'ok',
      environment: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Simple health check error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}