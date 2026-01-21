# 🔥 SECURITY HARDENING SMOKE TEST

## Pre-Test Checklist
- [ ] JWT_SECRET configured in environment
- [ ] DATABASE_URL set correctly  
- [ ] Frontend URL configured for CORS
- [ ] Application restarted after changes

## Smoke Test Cases

### 1. Authentication Security Tests
- [ ] **Login with valid credentials** - Should work normally
- [ ] **Login with invalid credentials** - Should fail with 401
- [ ] **Login with malformed JWT** - Should fail with 401
- [ ] **Login with expired token** - Should fail with 401
- [ ] **Brute force attack** - Should trigger rate limit after 5 attempts

### 2. Request Body Security Tests
- [ ] **Create quote** - Should work without logging sensitive data
- [ ] **Create pet** - Should work without logging request body
- [ ] **Transport calculation** - Should work without exposing addresses in logs

### 3. Headers Security Tests
- [ ] **Check security headers** - Should include CSP, HSTS, X-Frame-Options
- [ ] **CORS validation** - Should block unauthorized origins
- [ ] **Content-Type handling** - Should prevent MIME sniffing

### 4. Rate Limiting Tests
- [ ] **Auth endpoints** - Should limit to 5 requests per 15 minutes
- [ ] **Quote endpoints** - Should limit to 20 requests per 5 minutes  
- [ ] **Transport calculation** - Should limit to 10 requests per 5 minutes
- [ ] **General API** - Should allow 300 requests per 15 minutes (production)

### 5. Dependency Security Validation
- [ ] **Vulnerability scan** - Should show only development dependency issues
- [ ] **Production runtime** - Should not be affected by transitive vulnerabilities

### 6. Logging Security Tests
- [ ] **No PII in logs** - Should not log passwords, tokens, or full request bodies
- [ ] **Error handling** - Should sanitize error messages
- [ ] **Audit trail** - Should record actions without sensitive data

### 7. Environment Security Tests
- [ ] **Secrets protection** - .env should be in .gitignore
- [ ] **Config validation** - Application should fail if JWT_SECRET missing in production
- [ ] **Database credentials** - Should use environment variables, not hardcoded

## Expected Results

### ✅ PASS Criteria
- Authentication works with proper security
- No sensitive data exposure in logs
- Rate limiting active and working
- Security headers present
- CORS properly configured

### ❌ FAIL Criteria
- Any 500 errors in normal operations
- Sensitive data in console outputs
- Missing security headers
- Unlimited request attempts
- Secrets in version control

## Quick Test Commands

### Health Check
```bash
curl http://localhost:3001/heartbeat
```

### Security Headers Check
```bash
curl -I http://localhost:3001/heartbeat
# Look for: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
```

### Rate Limiting Test
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# Should get rate limited after 5 attempts
```

### JWT Security Test
```bash
# Test with malformed token
curl http://localhost:3001/customers \
  -H "Authorization: Bearer malformed.jwt.token"
# Should return 401
```

## Post-Test Validation

### Check Logs
```bash
# Verify no sensitive data exposure
tail -f logs/*.log | grep -E "(password|token|authorization)" --color=always
# Should return no matches
```

### Verify Headers
```bash
# Online security headers test
# Visit: https://securityheaders.com/?q=your-app-url.com
# Should get A+ rating
```

---

## 📋 TESTING STATUS REPORT

After completing the smoke tests, update this section:

### Tests Completed:
- [ ] Authentication Security ✅/❌
- [ ] Request Body Security ✅/❌  
- [ ] Headers Security ✅/❌
- [ ] Rate Limiting ✅/❌
- [ ] Dependency Security ✅/❌
- [ ] Logging Security ✅/❌
- [ ] Environment Security ✅/❌

### Overall Security Status: __/7 ✅

### Issues Found:
1. [Issue description]
2. [Issue description]

### Resolution Required:
- [ ] Fix 1: [Action]
- [ ] Fix 2: [Action]

---

**Important**: Complete ALL tests before deploying to production. Address any failures immediately.