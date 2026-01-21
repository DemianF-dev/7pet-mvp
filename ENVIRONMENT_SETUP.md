# Environment Variables Setup Guide

## Required Environment Variables

### Database
- `DATABASE_URL` - Full PostgreSQL connection string
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password  
- `POSTGRES_DB` - Database name

### Application
- `NODE_ENV` - Set to 'production' for production
- `PORT` - Application port (default: 3001)
- `FRONTEND_URL` - Your frontend URL for CORS

### Security (CRITICAL)
- `JWT_SECRET` - Minimum 32 characters, random string

### Google Maps (Optional)
- `GOOGLE_MAPS_API_KEY` - For transport calculation features

### Push Notifications (Optional)
- `VAPID_PUBLIC_KEY` - Web push public key
- `VAPID_PRIVATE_KEY` - Web push private key  
- `VAPID_EMAIL` - Email for push notifications

## Setup Instructions

1. Copy `.env.example` to `.env`
2. Fill in ALL required values
3. NEVER commit `.env` file to version control
4. For production, use secure, randomly generated secrets

## Security Notes

⚠️ **CRITICAL**: Change all default passwords before production
⚠️ **JWT_SECRET**: Must be at least 32 characters long and random
⚠️ **DATABASE_PASSWORD**: Use strong password, not 'postgres'

## Generating Secure Secrets

### JWT Secret (32+ chars)
```bash
openssl rand -base64 32
```

### Database Password
```bash
openssl rand -base64 24
```

## Deployment

### Railway (Production)
- Set environment variables in Railway dashboard
- DO NOT include secrets in docker-compose.yml
- Use Railway's environment variable management

### Local Development
- Use `.env` file locally
- Ensure `.env` is in `.gitignore`