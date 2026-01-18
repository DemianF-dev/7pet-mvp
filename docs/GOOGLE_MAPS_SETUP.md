# Google Maps Setup - Duas Chaves (Browser + Server)

## Resumo

Este projeto usa **duas chaves separadas** do Google Maps:

- **Browser Key** (`VITE_GOOGLE_MAPS_BROWSER_KEY`): Para autocomplete de endereços no frontend (Places API)
- **Server Key** (`GOOGLE_MAPS_SERVER_KEY`): Para cálculos de distância/tempo no backend (Distance Matrix API)

## Google Cloud Console - Configuração

### 1. Criar duas API Keys

Acesse: <https://console.cloud.google.com/apis/credentials>

#### Browser Key (Frontend)

- **Nome**: `7Pet - Browser Key`
- **Restrições de Aplicativo**: HTTP referrers (websites)
  - `https://my7.pet/*`
  - `https://*.vercel.app/*`
  - `http://localhost:5173/*`
  - `http://localhost:*` (para desenvolvimento)
- **Restrições de API**:
  - Places API
  - Maps JavaScript API (se renderizar mapas futuramente)

#### Server Key (Backend)

- **Nome**: `7Pet - Server Key`
- **Restrições de Aplicativo**: Endereços IP (opcional, menos seguro = sem restrição)
  - Nota: Vercel usa IPs dinâmicos, então restrição IP é difícil
  - Alternativa: deixar sem restrição mas monitorar uso
- **Restrições de API**:
  - Distance Matrix API
  - Directions API
  - Geocoding API

### 2. Habilitar APIs Necessárias

No Google Cloud Console, habilite:

- ✅ Places API
- ✅ Distance Matrix API
- ✅ Directions API (futuro)
- ✅ Geocoding API (futuro)

### 3. Ativar Billing

**CRÍTICO**: Sem billing ativado, as APIs retornarão erro 403.

- Acesse: <https://console.cloud.google.com/billing>
- Vincule um cartão de crédito ao projeto

---

## Vercel - Variáveis de Ambiente

### Frontend (`my7.pet`)

```
VITE_GOOGLE_MAPS_BROWSER_KEY=AIzaSy...
VITE_SOCKET_URL=https://7pet-realtime.up.railway.app
VITE_API_URL=https://7pet-backend.vercel.app
```

### Backend (`7pet-backend.vercel.app`)

```
GOOGLE_MAPS_SERVER_KEY=AIzaSy...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=...
```

**IMPORTANTE**: Após adicionar/alterar variáveis de ambiente no Vercel:

1. Ir em **Deployments**
2. Clicar nos 3 pontos do último deploy
3. Selecionar **Redeploy**
4. Marcar "Use existing Build Cache" (mais rápido)
5. Aguardar o redeploy completar

---

## Local Development

### Backend `.env`

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Auth
JWT_SECRET=your-jwt-secret

# Google Maps - Server Side
GOOGLE_MAPS_SERVER_KEY=AIzaSy...

# Store
STORE_ADDRESS="Av Hildebrando de Lima, 525, Osasco - SP"
```

### Frontend `.env`

```bash
# API
VITE_API_URL=http://localhost:3001

# Realtime
VITE_SOCKET_URL=http://localhost:3002

# Google Maps - Browser Side
VITE_GOOGLE_MAPS_BROWSER_KEY=AIzaSy...
```

---

## Arquitetura

### Frontend (React)

```
frontend/src/utils/googleMapsLoader.ts
  └─ Carrega script do Google Maps (Places)
  └─ Singleton idempotente (garante 1 carregamento)
  └─ Usa VITE_GOOGLE_MAPS_BROWSER_KEY

frontend/src/components/forms/AddressAutocomplete.tsx
  └─ Componente de autocomplete com fallback manual
  └─ Se key inválida: mostra input manual
  └─ Se usuário  MASTER: mostra erro detalhado
```

### Backend (Node/Express)

```
backend/src/services/googleMapsService.ts
  └─ MapsError class (codes: MAPS_AUTH, MAPS_QUOTA, etc.)
  └─ calculateTransportDetailed(origin, dest?, type)
  └─ Usa GOOGLE_MAPS_SERVER_KEY
  └─ Timeout: 10s por chamada

backend/src/controllers/quoteController.ts
  └─ calculateTransport endpoint
  └─ Retorna 502/503 com {ok, code, messageUser, messageDev}
  └─ Log: quoteId, addresses, upstreamStatus, code
```

---

## Troubleshooting

### Erro 403: "Invalid API Key" ou "REQUEST_DENIED"

**Backend**:

1. Verificar `GOOGLE_MAPS_SERVER_KEY` está configurada no Vercel
2. Verificar billing está ativado no Google Cloud
3. Verificar Distance Matrix API está habilitada
4. Verificar restrições da key (se houver) permitem o IP/domínio do servidor
5. Fazer redeploy após alterar env var

**Frontend**:

1. Verificar `VITE_GOOGLE_MAPS_BROWSER_KEY` está configurada no Vercel
2. Verificar Places API está habilitada
3. Verificar HTTP referrer restrictions permitem `my7.pet`
4. Abrir DevTools → Console → verificar script load error
5. Fazer redeploy após alterar env var

### Erro 429: "Quota Exceeded"

- Você atingiu o limite de requisições gratuitas ou do seu plano
- Verificar quota no Google Cloud Console
- Aguardar reset (diário/mensal dependendo da API)
- Ou upgrade do plano

### Frontend: "sugestão de endereço indisponível"

1. Key está faltando ou inválida
2. Places API não está habilitada
3. Script do Google Maps falhou ao carregar
4. Para debug (usuário MASTER): ver Developer Settings

### Backend retorna 500 genérico em vez de 502/503

- Erro não está sendo capturado como `MapsError`
- Verificar logs do Vercel para mensagem de erro real
- Possível erro de syntax ou import

---

## Custos Estimados

### Uso Esperado (base: 100 orçamentos/dia)

- **Places Autocomplete**: ~100 sessions/dia = ~$0.17/dia = ~$ 5/mês
- **Distance Matrix**: ~100 requests/dia = ~$0.50/dia = ~$15/mês
- **Total**: ~$20/mês

### Free Tier

Google oferece $200 de crédito mensal grátis para novos usuários.

- Com o free tier, uso normal do 7Pet seria **gratuito**

### Alertas Recomendados

1. No Google Cloud Console → Billing → Budget & Alerts
2. Criar alerta para:
   - 50% do limite ($100)
   - 90% do limite ($180)
   - 100% do limite ($200)

---

## Checklist de Deploy

### Primeira Vez

- [ ] Criar 2 API keys no Google Cloud
- [ ] Configurar restrições (HTTP referrers + APIs)
- [ ] Habilitar todas as APIs necessárias
- [ ] Ativar billing
- [ ] Adicionar keys nas env vars do Vercel (frontend + backend)
- [ ] Deploy frontend
- [ ] Deploy backend
- [ ] Testar autocomplete em my7.pet
- [ ] Testar cálculo de transporte em orçamento

### Após Mudanças

- [ ] Atualizar env var no Vercel (se key mudou)
- [ ] Redeploy
- [ ] Verificar `/diag` mostra `mapsServerKeyPresent: true`
- [ ] Testar funcionalidade

---

## Segurança

### ✅ Boas Práticas Implementadas

- Chaves separadas (browser vs server)
- Backend key NUNCA exposta no frontend
- Frontend key restrita por HTTP referrers
- Errors estruturados (sem vazar segredos)
- `/diag` não expõe valores das keys
- Debug endpoint removido (não expõe keys)

### ⚠️ Atenção

- Billing deve estar ativado (senão erro 403)
- Keys devem ter restrições configuradas (evitar abuso)
- Monitorar uso mensalmente

---

## Links Úteis

- Google Cloud Console: <https://console.cloud.google.com>
- Pricing Calculator: <https://cloud.google.com/products/calculator>
- Places API Docs: <https://developers.google.com/maps/documentation/places/web-service>
- Distance Matrix Docs: <https://developers.google.com/maps/documentation/distance-matrix>

---

**Última atualização**: 2026-01-18
