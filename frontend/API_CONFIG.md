# API Configuration Guide

## Environment Variables

### Local Development (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=7Pet
```
✅ Use HTTP (not HTTPS) for localhost

### Production (.env.production)
```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=7Pet
```
⚠️ **IMPORTANT**: Update this with your actual backend URL before deploying

## Vercel Environment Variables

Configure in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| VITE_API_URL | https://your-backend.vercel.app | Production |
| VITE_API_URL | http://localhost:3001 | Preview, Development |

## Auto-Correction Feature

The API client now automatically detects and fixes common configuration errors:

- ❌ `https://localhost:3001` → ✅ `http://localhost:3001`
- Logs configuration details to browser console
- Falls back to localhost if VITE_API_URL is not set

## Troubleshooting

### "Network Error" or "sem conexão"
1. Open browser DevTools (F12)
2. Check Console for `[API Config]` messages
3. Verify the URL being used
4. Common fixes:
   - Local: Ensure backend is running (`npm run dev` in backend folder)
   - Production: Verify Vercel environment variables are set
   - Check for HTTPS on localhost (auto-corrected, but log will show warning)

### Backend URL for Production

**CRITICAL**: Backend must be deployed to a public URL for production to work.

Options:
- Vercel: Deploy backend folder separately
- Render: Free tier available
- Railway: Easy deployment

Update `.env.production` and Vercel environment variable with the deployed backend URL.
