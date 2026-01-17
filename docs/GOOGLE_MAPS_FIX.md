# 🔧 Correção: Erro 403 Google Maps API em Produção

## Diagnóstico

✅ **Local**: A chave está funcionando perfeitamente
❌ **Produção**: Erro 403 - Problema de autorização/configuração

## Próximos Passos

### 1️⃣ Verificar Variável de Ambiente na Vercel

Acesse o painel da Vercel:

```
https://vercel.com/[seu-projeto]/settings/environment-variables
```

**Verifique:**

- [ ] A variável `GOOGLE_MAPS_API_KEY` existe
- [ ] Ela está configurada para o ambiente correto (Production)
- [ ] O valor está **completo** (39 caracteres começando com `AIza...`)

**Chave correta que está funcionando localmente:**

```
AIzaSyB_1JJL1EeRzWhcecCbB4o_2ZvkfNqKjhc
```

### 2️⃣ Verificar Restrições da API Key no Google Cloud

Acesse:

```
https://console.cloud.google.com/apis/credentials
```

**Verifique as restrições da chave:**

#### Opção A: Sem Restrições (Recomendado para MVP)

- [ ] "Application restrictions" = **None**
- [ ] "API restrictions" = **Don't restrict key**

#### Opção B: Com Restrições (Mais Seguro)

Se você quer manter restrições, configure assim:

**Application restrictions:**

- [ ] Marque "HTTP referrers (web sites)"
- [ ] Adicione:

  ```
  *.vercel.app/*
  seu-dominio.com/*
  localhost/*
  ```

**OU para servidor:**

- [ ] Marque "IP addresses (web servers, cron jobs, etc.)"
- [ ] Adicione: `0.0.0.0/0` (ATENÇÃO: permite qualquer IP)

**API restrictions:**

- [ ] Marque "Restrict key"
- [ ] Selecione APENAS:
  - [x] Distance Matrix API
  - [x] Geocoding API (opcional, mas recomendado)

### 3️⃣ Verificar APIs Habilitadas

No Google Cloud Console:

```
https://console.cloud.google.com/apis/library
```

**APIs que DEVEM estar habilitadas:**

- [ ] ✅ Distance Matrix API
- [ ] ✅ Geocoding API (recomendado)

### 4️⃣ Verificar Billing

```
https://console.cloud.google.com/billing
```

- [ ] Billing está ativado
- [ ] Não há problemas de pagamento
- [ ] Não atingiu limite de cota

### 5️⃣ Depois de Corrigir

1. **Salve as alterações** no Google Cloud Console
2. **Aguarde 2-5 minutos** para propagação
3. **Re-deploy** na Vercel (se mudou a variável de ambiente):

   ```bash
   git commit --allow-empty -m "trigger redeploy"
   git push origin main
   ```

4. **Teste novamente** na produção

## Comando de Teste Rápido

Se quiser testar direto da produção, adicione este endpoint temporário:

```typescript
// Em quoteController.ts
async testMapsConfig(req: Request, res: Response) {
    try {
        const hasKey = !!process.env.GOOGLE_MAPS_API_KEY;
        const keyPrefix = process.env.GOOGLE_MAPS_API_KEY?.substring(0, 10);
        
        if (!hasKey) {
            return res.json({ 
                error: 'Chave não encontrada nas variáveis de ambiente',
                env: process.env.NODE_ENV 
            });
        }
        
        const result = await mapsService.calculateTransportDetailed(
            'Av. Paulista, 1000, São Paulo - SP'
        );
        
        return res.json({ 
            success: true, 
            keyPrefix,
            result: {
                total: result.total,
                totalKm: result.totalKm
            }
        });
    } catch (error: any) {
        return res.json({ 
            success: false, 
            error: error.message,
            stack: error.stack 
        });
    }
}
```

## Solução Mais Provável

**99% de chance de ser uma destas:**

1. 🔴 Variável `GOOGLE_MAPS_API_KEY` **não está configurada** na Vercel
2. 🔴 A chave está com **restrições de IP/referrer** que bloqueiam a Vercel
3. 🔴 **Billing não está ativado** no projeto do Google Cloud

---

## ✅ Checklist Final

Após fazer as correções acima, teste:

- [ ] Local: `npm run dev` → Criar orçamento → Calcular KMs
- [ ] Produção: Acessar site → Criar orçamento → Calcular KMs
- [ ] Verificar logs no Vercel para confirmar ausência de erros 403
