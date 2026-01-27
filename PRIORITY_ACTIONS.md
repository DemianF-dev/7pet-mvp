# AÇÕES PRIORITÁRIAS - 7Pet MVP

Este documento lista as ações necessárias em ordem de prioridade após a auditoria do sistema.

---

## AÇÕES IMEDIATAS (Fazer AGORA)

### 1. Rotacionar Credenciais Expostas

**Por que:** Credenciais foram expostas no histórico do git e podem ter sido comprometidas.

#### Supabase Database
1. Acesse: https://app.supabase.com/project/zpcwgsjsktqjncnpgaon/settings/database
2. Clique em "Reset database password"
3. Gere uma nova senha forte
4. Atualize `DATABASE_URL` e `DIRECT_URL` nas variáveis de ambiente do Vercel

#### Google Cloud API Keys
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Revogue as seguintes chaves:
   - `AIzaSyBprrlBtEL5EI3yZP1LzsmuvNvwxQqOfSA` (Maps)
   - `AIzaSyBeu6X05Yk04B4dhPqo7UsCQkaNhX6SB10` (Maps/Gemini)
3. Crie novas chaves com restrições:
   - Restrinja por domínio: `*.my7.pet`, `localhost:*`
   - Restrinja por API: apenas Maps JavaScript API, Geocoding, Distance Matrix

#### JWT Secret
1. Gere um novo secret com 64+ caracteres:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Atualize `JWT_SECRET` nas variáveis de ambiente do Vercel
3. **IMPORTANTE:** Todos os usuários serão deslogados!

### 2. Limpar Histórico Git

**ATENÇÃO:** Isso reescreve o histórico. Certifique-se de que todos os colaboradores saibam.

```bash
# Método 1: BFG Repo Cleaner (recomendado)
# Baixe de: https://rtyley.github.io/bfg-repo-cleaner/

# Criar arquivo com strings sensíveis para remover
cat > sensitive-strings.txt << 'EOF'
s%23Dfs%40718%2A
AIzaSyBprrlBtEL5EI3yZP1LzsmuvNvwxQqOfSA
AIzaSyBeu6X05Yk04B4dhPqo7UsCQkaNhX6SB10
7pet-super-secret-key-2025
admin123
logistica123
comercial123
EOF

# Executar BFG
java -jar bfg.jar --replace-text sensitive-strings.txt .

# Limpar e forçar push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force --all
```

### 3. Atualizar Variáveis no Vercel

1. Acesse: https://vercel.com/YOUR_TEAM/7pet-backend/settings/environment-variables
2. Atualize:
   - `DATABASE_URL` - nova connection string
   - `DIRECT_URL` - nova direct connection string
   - `JWT_SECRET` - novo secret
   - `GOOGLE_MAPS_API_KEY` - nova chave

---

## AÇÕES DE ALTA PRIORIDADE (Esta Semana)

### 4. Corrigir Erros TypeScript no Frontend

Execute no diretório frontend:
```bash
cd frontend
npx tsc --noEmit 2>&1 | tee tsc_errors.txt
```

**Erros mais comuns a corrigir:**

#### A) Imports não utilizados
```bash
# Instalar e configurar ESLint com auto-fix
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npx eslint --fix "src/**/*.{ts,tsx}"
```

#### B) Parâmetros com tipo `any` implícito
Adicionar tipos explícitos:
```typescript
// Antes
const handleChange = (prev) => ...

// Depois
const handleChange = (prev: QuoteFormData) => ...
```

#### C) Tipos `undefined` não tratados
```typescript
// Antes
const id: string = user?.id;

// Depois
const id: string = user?.id ?? '';
// ou
if (!user?.id) return;
const id = user.id;
```

### 5. Remover Campo plainPassword (Médio Prazo)

**ATENÇÃO:** Esta mudança requer migração cuidadosa.

#### Fase 1: Parar de armazenar novas senhas em plainPassword
Editar `backend/src/services/authService.ts`:
```typescript
// REMOVER esta linha:
plainPassword: password || null,
```

#### Fase 2: Migração de dados
```sql
-- Limpar dados existentes (execute via Supabase SQL Editor)
UPDATE "User" SET "plainPassword" = NULL WHERE "plainPassword" IS NOT NULL;
```

#### Fase 3: Remover do schema
Editar `backend/prisma/schema.prisma`:
```prisma
// REMOVER esta linha:
plainPassword String?
```

Executar migração:
```bash
cd backend
npx prisma migrate dev --name remove_plain_password
```

### 6. Adicionar Validação de Upload

Criar arquivo `backend/src/utils/fileValidation.ts`:
```typescript
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];

export function validateFile(file: Express.Multer.File): boolean {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Extensão não permitida: ${ext}`);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.mimetype}`);
  }

  return true;
}
```

---

## AÇÕES DE MÉDIA PRIORIDADE (Este Mês)

### 7. Centralizar Constantes de Storage

Criar `frontend/src/constants/storage.ts`:
```typescript
export const STORAGE_KEYS = {
  AUTH_TOKEN: '7pet-token',
  AUTH_STORAGE: '7pet-auth-storage',
  QUERY_CACHE: '7pet-react-query-cache',
  THEME: '7pet-theme',
  DEVICE_ID: '7pet-device-id'
} as const;
```

Atualizar todos os arquivos que usam strings hardcoded.

### 8. Configurar ESLint

Criar `frontend/.eslintrc.json`:
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### 9. Remover Verificação de Master por Email

Localizar e remover em todos os arquivos:
```typescript
// REMOVER padrões como:
const MASTER_EMAIL = 'oidemianf@gmail.com';
user?.email === MASTER_EMAIL

// USAR apenas:
user?.division === 'MASTER' || user?.role === 'MASTER'
```

---

## CHECKLIST DE VERIFICAÇÃO

Após completar as ações, verifique:

- [ ] Novas credenciais funcionando em produção
- [ ] Usuários conseguem fazer login
- [ ] API do Google Maps funcionando
- [ ] Build do frontend sem erros
- [ ] Testes passando (se existirem)
- [ ] Histórico git limpo (verificar com `git log --all --oneline | grep -i password`)

---

## CONTATOS DE EMERGÊNCIA

Se algo der errado durante a rotação de credenciais:

- **Supabase Support:** https://supabase.com/support
- **Vercel Support:** https://vercel.com/support
- **Google Cloud Support:** https://cloud.google.com/support

---

*Documento criado em 2026-01-27 - Manter atualizado conforme ações são completadas*
