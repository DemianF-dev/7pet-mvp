# 🔴 URGENTE: Configurar GOOGLE_MAPS_API_KEY na Vercel

## ❌ Problema Identificado

```
"The provided API key is invalid"
```

Isso significa que a chave configurada na **Vercel está diferente** da sua chave local.

---

## ✅ SOLUÇÃO: Configurar Variável de Ambiente na Vercel

### Passo 1: Acessar Configurações da Vercel

1. Acesse: <https://vercel.com>
2. Selecione seu projeto **7pet-mvp** (ou nome do projeto)
3. Vá em **Settings** (⚙️)
4. Clique em **Environment Variables** (no menu lateral)

### Passo 2: Adicionar/Atualizar a Variável

**Nome da Variável:**

```
GOOGLE_MAPS_API_KEY
```

**Valor (copie exatamente):**

```
AIzaSyB_1JJL1EeRzWhcecCbB4o_2ZvkfNqKjhc
```

**Ambientes:**

- ✅ **Production** (marque este!)
- ✅ **Preview** (opcional, mas recomendado)
- ✅ **Development** (opcional)

### Passo 3: Salvar e Re-deploy

1. Clique em **Save**
2. Vá em **Deployments**
3. Clique nos **...** (três pontinhos) do último deployment
4. Selecione **Redeploy**
5. Aguarde o deploy finalizar (~2 minutos)

---

## 🧪 VERIFICAR SE FUNCIONOU

### Opção A: Testar com o Endpoint de Debug

Acesse no navegador (lembre de fazer login primeiro):

```
https://seu-dominio.vercel.app/api/quotes/debug-maps-config
```

**Resposta esperada:**

```json
{
  "hasKey": true,
  "keyLength": 39,
  "keyPrefix": "AIzaSyB_1JJL...",
  "keySuffix": "...NqKjhc",
  "expectedLength": 39,
  "isCorrectLength": true,
  "env": "production"
}
```

Se aparecer `hasKey: false`, a variável NÃO foi configurada corretamente!

### Opção B: Testar Calculando KMs

1. Acesse a produção
2. Vá em **Orçamentos** → **Novo Orçamento**
3. Preencha um endereço
4. Clique em **Calcular KMs**

Deve funcionar sem erros! ✅

---

## 🚨 Se Ainda Não Funcionar

### Verifique a chave no Google Cloud Console

1. Acesse: <https://console.cloud.google.com/apis/credentials>
2. Encontre sua API Key
3. Clique para editar

**Restrições da Aplicação:**

- Opção 1 (Mais fácil): Selecione **None** (sem restrições)
- Opção 2: Selecione **HTTP referrers** e adicione:

  ```
  *.vercel.app/*
  seu-dominio.com/*
  ```

**Restrições de API:**

- Opção 1 (Mais fácil): Selecione **Don't restrict key**
- Opção 2: Marque apenas:
  - ✅ Distance Matrix API
  - ✅ Geocoding API

### Verifique o Billing

1. Acesse: <https://console.cloud.google.com/billing>
2. Confirme que o billing está **ativo** ✅
3. Confirme que não há problemas de pagamento

---

## 📋 Checklist Final

Antes de testar novamente:

- [ ] Adicionou `GOOGLE_MAPS_API_KEY` na Vercel
- [ ] Valor está **exatamente** como no local: `AIzaSyB_1JJL1EeRzWhcecCbB4o_2ZvkfNqKjhc`
- [ ] Marcou o ambiente **Production**
- [ ] Clicou em **Save**
- [ ] Fez **Redeploy**
- [ ] Aguardou o deploy finalizar
- [ ] Testou o endpoint `/api/quotes/debug-maps-config`
- [ ] Verificou que `hasKey: true` e `keyLength: 39`

---

## 🎯 Comandos Úteis

Se quiser fazer um redeploy pelo Git (força novo deploy):

```bash
git commit --allow-empty -m "redeploy: fix google maps env var"
git push origin main
```

---

## ⚠️ IMPORTANTE

**DEPOIS DE CORRIGIR**, remova o endpoint de debug por segurança:

```typescript
// Remover estas linhas de backend/src/routes/quoteRoutes.ts
router.get('/debug-maps-config', ...); // REMOVER
```

Ou podemos fazer isso depois que confirmar que está funcionando! 👍
