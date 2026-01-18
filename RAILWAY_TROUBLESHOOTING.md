# 🐛 Railway Troubleshooting

Problemas comuns e como resolver.

---

## ❌ Erro 404: "GET /socket.io/?EIO=4... 404"

### Sintoma

Console do navegador mostra erros 404 repetidos tentando conectar ao Socket.io.

### Causa

Frontend está conectando na URL errada (ainda aponta para backend Vercel).

### Solução

1. **Verificar variável de ambiente**:
   - Vercel → Projeto Frontend → Settings → Environment Variables
   - Confirme que `VITE_SOCKET_URL` = `https://SUA-URL-RAILWAY`

2. **Redeploy**:
   - Vercel → Deployments → Redeploy

3. **Limpar cache do navegador**:
   - Chrome/Edge: `Ctrl + Shift + Delete`
   - Marque "Cached images and files"
   - Clear data

4. **Testar em aba anônima** (Ctrl+Shift+N)

---

## 🔥 Railway: "Application failed to respond"

### Sintoma

Railway mostra deploy com sucesso, mas `/health` retorna 503 ou timeout.

### Causa

Servidor não está iniciando corretamente.

### Solução

1. **Ver logs do Railway**:
   - Railway Dashboard → seu projeto → View Logs
   - Procure por erros de startup

2. **Verificar PORT**:
   - Railway define `PORT` automaticamente
   - Código já usa: `const PORT = process.env.PORT || 3000`
   - Não altere isso!

3. **Verificar dependências**:
   - Railway → Deployments → Build Logs
   - Procure por erros de `npm install`

4. **Restart manual**:
   - Railway → Settings → Restart

---

## 🚫 Erro 403: "Forbidden: Invalid secret"

### Sintoma

Ao testar `/emit`, retorna erro 403.

### Causa

`X-Socket-Secret` header não corresponde ao `SOCKET_SERVER_SECRET`.

### Solução

1. **Comparar secrets**:
   - Railway → Variables → `SOCKET_SERVER_SECRET`
   - Vercel Backend → Env Vars → `SOCKET_SERVER_SECRET`
   - Devem ser **EXATAMENTE iguais**

2. **Se diferentes**:
   - Copie o valor do Railway
   - Cole no Vercel Backend
   - Redeploy do backend

3. **Testar novamente**:

```bash
curl -X POST https://SUA-URL-RAILWAY/emit \
  -H "Content-Type: application/json" \
  -H "X-Socket-Secret: SEU-SECRET-AQUI" \
  -d '{"event":"test","data":{"msg":"hello"}}'
```

---

## ⏱️ Mensagens de Chat Atrasadas

### Sintoma

Mensagens demoram segundos/minutos para aparecer na outra aba.

### Causa

1. Frontend não conectado ao Railway
2. Railway servidor está sobrecarregado/crashou
3. CORS bloqueando conexão

### Solução

1. **Verificar conexão**:
   - F12 → Console
   - Deve ter: `🔌 Socket connected: [ID]`
   - Se não: voltar ao erro 404 acima

2. **Testar Railway health**:

```
https://SUA-URL-RAILWAY/health
```

- Deve retornar JSON com `status: "ok"`
- Se não: Railway pode estar offline

1. **Ver logs Railway**:
   - Dashboard → Logs
   - Procure por crashes ou `Error` messages

2. **Verificar CORS**:
   - Railway → Variables → `SOCKET_ALLOWED_ORIGINS`
   - Deve conter: `https://my7.pet`
   - Redeploy se alterar

---

## 💻 Como ver logs do Railway

1. Abra [railway.app](https://railway.app)
2. Selecione seu projeto `7pet-realtime`
3. Clique na aba **"Deployments"**
4. Clique no deploy mais recente
5. Vá para **"View Logs"**

**O que procurar**:

- ✅ `🚀 7Pet Realtime Server running on port 3000`
- ✅ `🔌 Socket connected: [ID]`
- ❌ `Error:` qualquer mensagem de erro
- ❌ `TypeError`, `SyntaxError`, etc.

---

## 🔍 Como debugar conexões Socket.io

### No Frontend (Navegador)

1. Abra DevTools (F12)
2. **Console** - ver mensagens de conexão:

   ```
   🔌 Initializing Socket.io connection to: https://...
   🔌 Socket connected: abc123
   ```

3. **Network tab**:
   - Filter: `socket.io`
   - Deve ver requisições para Railway URL
   - Se ver Vercel backend URL → erro de config

4. **Application tab** (Chrome):
   - Storage → Cookies
   - Limpar cookies se comportamento estranho

### No Railway (Servidor)

1. Railway → Logs
2. Procure por:

   ```
   🔌 Socket connected: [ID]
   👤 User [userId] linked to socket [ID]
   💬 Socket [ID] joined chat:[chatId]
   ```

3. Se não vê essas mensagens:
   - Frontend não está conectando
   - Verificar `VITE_SOCKET_URL`

---

## 🔄 Railway: Deploy travado

### Sintoma

Deploy fica em "Building..." por mais de 5 minutos.

### Solução

1. **Cancelar e redeploytry**:
   - Railway → Deployments
   - Clique nos "..." → Cancel Build
   - Aguarde 30s
   - Click "Redeploy"

2. **Verificar GitHub**:
   - Se Railway não consegue acessar o repo
   - Settings → Integrations
   - Reautorize GitHub

---

## 💸 Railway: Créditos acabando

### Sintoma

Email da Railway: "You're running out of credits"

### Solução

1. **Verificar uso**:
   - Railway → Usage
   - Ver quanto foi consumido

2. **Planos**:
   - Trial: $5 USD grátis
   - Developer: $5/mês
   - **Para 7Pet**: Developer deve ser suficiente

3. **Otimizar**:
   - Railway cobra por hora ativa
   - Em dev, pause o serviço quando não usar:
     - Settings → Pause Service

---

## 🆘 Nada Funciona - Reset Completo

Se nada acima resolveu:

1. **Deletar projeto Railway**:
   - Settings → Danger → Delete Service

2. **Recriar do zero**:
   - Seguir [GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md)

3. **Verificar código**:

```bash
cd c:\Users\oidem\.gemini\antigravity\scratch\7pet-mvp\realtime
npm install
npm run dev
```

- Se funciona local mas não Railway, é configuração
- Se não funciona local, é o código

---

## 📞 Contatos de Suporte

- **Railway**: [railway.app/help](https://railway.app/help)
- **Documentação**: [docs.railway.app](https://docs.railway.app)
- **Discord Railway**: [discord.gg/railway](https://discord.gg/railway)

---

**Dica**: 90% dos problemas são variáveis de ambiente erradas ou frontend conectando na URL antiga. Sempre verifique isso primeiro!
