# 🗺️ Configuração da API do Google Maps

## ✅ Status Atual

A API do Google Maps está configurada no projeto 7Pet e funciona através do serviço `mapsService.ts`.

### Chaves de API Encontradas

- **Backend Local (.env)**: `AIzaSyB_1JJL1EeRzWhcecCbB4o_2ZvkfNqKjhc`
- **Backend Test (.env-test)**: `AIzaSyBprrlBtEL5EI3yZP1LzsmuvNvwxQqOfSA`

---

## 🔧 Configuração no Vercel (Produção)

### Passo 1: Acessar o Dashboard do Vercel

1. Acesse: <https://vercel.com/dashboard>
2. Selecione o projeto **7pet-backend** (ou nome equivalente)
3. Vá em **Settings** → **Environment Variables**

### Passo 2: Adicionar/Verificar a Variável

Adicione as seguintes variáveis de ambiente:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `GOOGLE_MAPS_API_KEY` | `AIzaSyB_1JJL1EeRzWhcecCbB4o_2ZvkfNqKjhc` | Production, Preview, Development |
| `STORE_ADDRESS` | `Av. Hildebrando de Lima, 525, Osasco - SP` | Production, Preview, Development |

### Passo 3: Redesploy

Após adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos **três pontos** no último deployment
3. Selecione **Redeploy**
4. Marque **"Use existing Build Cache"** para ir mais rápido

---

## 🔑 Configuração da API no Google Cloud Console

### Verificar Permissões da Chave

1. Acesse: <https://console.cloud.google.com/apis/credentials>
2. Encontre a chave: `AIzaSyB_1JJL1EeRzWhcecCbB4o_2ZvkfNqKjhc`
3. Verifique se as seguintes APIs estão **habilitadas**:
   - ✅ **Distance Matrix API**
   - ✅ **Geocoding API**
   - ✅ **Maps JavaScript API** (se usar no frontend)

### Habilitar APIs

Se alguma API não estiver habilitada:

1. Acesse: <https://console.cloud.google.com/apis/library>
2. Pesquise por "Distance Matrix API"
3. Clique em **"ENABLE"**
4. Repita para "Geocoding API"

### Verificar Billing

⚠️ **IMPORTANTE**: A API do Google Maps **requer billing ativo**

1. Acesse: <https://console.cloud.google.com/billing>
2. Certifique-se de que o projeto tem um método de pagamento válido
3. Verifique se não há alertas de billing suspenso

### Restrições da Chave (Opcional - Segurança)

Para maior segurança, configure restrições:

1. **Application restrictions**: HTTP referrers
   - Adicione: `https://7pet-backend.vercel.app/*`
   - Adicione: `http://localhost:*` (para dev local)
2. **API restrictions**: Selecione apenas as APIs necessárias
   - Distance Matrix API
   - Geocoding API

---

## 🧪 Testar a API Localmente

### Teste Rápido via Script

Execute no terminal do backend:

```bash
cd backend
node test-maps-key.js
```

### Teste via cURL

```bash
curl "https://maps.googleapis.com/maps/api/distancematrix/json?origins=Osasco&destinations=São+Paulo&key=AIzaSyB_1JJL1EeRzWhcecCbB4o_2ZvkfNqKjhc"
```

**Resposta Esperada:**

```json
{
  "status": "OK",
  "rows": [...]
}
```

**Possíveis Erros:**

- `"status": "REQUEST_DENIED"` → Billing não ativo ou API não habilitada
- `403 Forbidden` → Chave inválida ou restrições bloqueando
- `401 Unauthorized` → Chave não encontrada

---

## 📍 Como Funciona no Código

### Backend: `mapsService.ts`

O serviço faz chamadas para:

1. **Distance Matrix API** - Calcula distância e tempo entre endereços
2. Usado em: Cálculo de transporte logístico

```typescript
// Exemplo de uso:
const result = await mapsService.calculateTransportDetailed(
    "Rua ABC, 123 - São Paulo",  // Origem
    "Rua XYZ, 456 - Osasco",     // Destino (opcional)
    "ROUND_TRIP"                  // Tipo
);

// Retorna:
{
    breakdown: {
        largada: { distance, duration, price },
        leva: { distance, duration, price },
        traz: { distance, duration, price },
        retorno: { distance, duration, price }
    },
    total: 150.50,
    totalDistance: "45.2 km",
    totalDuration: "60 min"
}
```

### Rotas que Usam

- `POST /quotes` - Cálculo de transporte em orçamentos
- `GET /quotes/transport-preview` - Preview de custo de transporte

---

## 🚨 Troubleshooting

### Erro: "GOOGLE_MAPS_API_KEY is missing!"

**Solução:**

1. Verifique se o `.env` no backend tem a chave
2. Reinicie o servidor backend
3. No Vercel, adicione a variável e faça redeploy

### Erro: "REQUEST_DENIED"

**Solução:**

1. Ative o billing no Google Cloud
2. Habilite a Distance Matrix API
3. Aguarde 5-10 minutos para propagação

### Erro: 403 Forbidden

**Solução:**

1. Verifique restrições da chave no Google Cloud Console
2. Se houver IP restrictions, remova temporariamente para teste
3. Adicione o domínio do Vercel às restrições HTTP

### API retorna resultados em desenvolvimento mas não em produção

**Solução:**

1. Verifique se a variável `GOOGLE_MAPS_API_KEY` está no Vercel
2. Confirme que está aplicada em "Production"
3. Faça um redeploy completo

---

## ✅ Checklist de Verificação

- [ ] Variável `GOOGLE_MAPS_API_KEY` está no backend/.env local
- [ ] Variável `GOOGLE_MAPS_API_KEY` está configurada no Vercel
- [ ] Distance Matrix API está habilitada no Google Cloud
- [ ] Geocoding API está habilitada no Google Cloud
- [ ] Billing está ativo no projeto Google Cloud
- [ ] Teste local funciona (executar test-maps-key.js)
- [ ] Teste em produção funciona (fazer requisição em <https://7pet-backend.vercel.app/api/>...)

---

## 📞 Contato de Suporte

Se ainda houver problemas:

1. Verifique os logs do Vercel: <https://vercel.com/[seu-projeto]/logs>
2. Verifique o console do backend local
3. Consulte a documentação oficial: <https://developers.google.com/maps/documentation/distance-matrix>
