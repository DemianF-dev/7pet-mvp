---
name: perfect-deploy
description: Executa o ciclo completo de deployment seguro com verificações locais, sincronização de banco e testes de saúde em produção.
---

# 🚀 Perfect Deploy Skill

Esta skill deve ser utilizada sempre que o usuário solicitar o deploy de alterações, subida para produção ou atualização do sistema 7Pet.

## 📋 Fluxo de Execução

Sempre siga estas fases rigorosamente:

### FASE 0: Automação (Novo)

Para facilitar, você pode simplesmente rodar o script oficial:
`powershell .\scripts\deploy-7pet.ps1`

### FASE 1: Integridade Local (Obrigatório)

Antes de qualquer push, garanta que o código compila.

1. Navegue para `frontend/` e execute `npm run build`.
2. Navegue para `backend/` e execute `npm run build` (isso incluirá o `prisma generate`).
3. **Se houver erros:** Corrija-os localmente antes de prosseguir. Não faça deploy de código quebrado.

### FASE 2: Sincronização de Banco de Dados

Garante que o Supabase/Railway-DB esteja com o schema correto.

1. Verifique se houve mudanças em `backend/prisma/schema.prisma`.
2. Se sim, execute `npx prisma db push --accept-data-loss` (apenas em desenvolvimento/estágio) ou o workflow específico de banco de dados do projeto.
   - **Nota:** Respeite sempre o workflow `/database-safety`.

### FASE 3: Versionamento e Gatilho

1. Faça o commit das alterações com uma mensagem descritiva (ex: `feat: adding new pet module`).
2. Execute `git push origin main`.
3. Verifique se o GitHub recebeu o push.

### FASE 4: Monitoramento de Deploy

Aguarde o deploy ser processado pelas plataformas:

- **Vercel:** Frontend e API Serverless.
- **Railway:** Realtime Socket Server e (opcionalmente) Worker/Postgres.

1. Aguarde aproximadamente 2-3 minutos.

### FASE 5: Verificação Pós-Deploy ("The Perfect Check")

Não assuma que o deploy funcionou só porque o push foi feito.

1. Execute o script de fumaça: `node scripts/smoke-test-prod.js`.
2. Verifique os endpoints de saúde via `read_url_content`:
   - Backend: `https://7pet-backend-production.up.railway.app/api/health` (ajuste a URL se necessário)
   - Realtime: `https://7pet-realtime-production.up.railway.app/health`
3. **Checklist Visual:** Se possível, use a ferramenta de browser para abrir o site em produção e verificar o login.

### FASE 6: Loop de Auto-Correção

**Se qualquer verificação da Fase 5 falhar:**

1. Use `read_url_content` ou ferramentas de log para identificar o erro.
2. Analise o erro (ex: Variável de ambiente faltando, erro de runtime).
3. Corrija o erro no código local.
4. **REINICIE** o processo a partir da FASE 1.

## 🛠️ Comandos Úteis

- **Verificar Saúde:** `node scripts/smoke-test-prod.js`
- **Build Backend:** `cd backend && npm run build`
- **Build Frontend:** `cd frontend && npm run build`

> [!IMPORTANT]
> Nunca considere o deploy finalizado sem um status "OK" nos endpoints de saúde.
