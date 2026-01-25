module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    message: 'Basic test - CommonJS exports'
  });
};