# 🔔 Sistema de Notificações 7Pet

## 📋 Visão Geral

Sistema completo de notificações automáticas para clientes e operadores do 7Pet.

---

## ✅ Tipos de Notificações Implementadas

### 1. **🐾 Notificação 30min Antes do Agendamento (CLIENTE)**

**Quando**: 30 minutos antes de cada agendamento confirmado

**Quem recebe**:

- ✅ **Cliente** (dono do pet)
- ✅ **Operador/Gerente** (roles: GESTAO, ADMIN, MASTER)
- ✅ **Profissional Responsável** (se houver `performerId`)

**Exemplo de notificação**:

```
Título: 🐾 Agendamento em 30 minutos!
Mensagem: Totó tem um agendamento às 14:30. Já estamos preparando tudo! 🎉
```

**Detalhes técnicos**:

- Janela de verificação: 25-35 minutos antes
- Evita duplicação: Marca como notificado após envio
- Inclui: pet name, horário, serviços

---

### 2. **📅 Revisão Diária às 22:00 (OPERADORES)**

**Quando**: Todos os dias às 22:00

**Quem recebe**:

- ✅ Todos os **operadores** (OPERACIONAL, GESTAO, ADMIN, SPA, MASTER)

**Exemplo de notificação**:

```
Título: 📅 Atenção! Revise sua agenda de amanhã
Mensagem: Você tem 8 agendamento(s) programado(s) para amanhã. Revise e se prepare! 💼
```

**Detalhes técnicos**:

- Executa apenas entre 22:00-22:05
- Conta agendamentos do dia seguinte
- Prioridade: MEDIUM

---

### 3. **💰 Orçamento Respondido (CLIENTE)**

**Quando**: Staff responde/atualiza um orçamento

**Quem recebe**:

- ✅ **Cliente** que solicitou o orçamento

**Como acionar**:

```typescript
await notificationService.notifyQuoteResponse(
    quoteId, 
    userId, 
    "Seu orçamento foi aprovado! Total: R$ 150,00"
);
```

**Exemplo de notificação**:

```
Título: 💰 Orçamento Respondido!
Mensagem: Seu orçamento #42 foi respondido. Confira os detalhes!
```

---

### 4. **🔄 Alterações em Agendamento (CLIENTE)**

**Quando**: Agendamento é alterado, cancelado ou confirmado

**Quem recebe**:

- ✅ **Cliente** dono do agendamento

**Tipos**:

- `UPDATE`: Agendamento alterado (🔄)
- `CANCEL`: Agendamento cancelado (❌)
- `CONFIRM`: Agendamento confirmado (✅)

**Como acionar**:

```typescript
await notificationService.notifyAppointmentChange(
    appointmentId,
    userId,
    'UPDATE',
    "Seu agendamento foi reagendado para 15/01 às 14:00"
);
```

---

### 5. **💬 Resposta de Suporte (CLIENTE)**

**Quando**: Staff responde um ticket de suporte

**Quem recebe**:

- ✅ **Cliente** que abriu o ticket

**Como acionar**:

```typescript
await notificationService.notifySupportResponse(
    ticketId,
    userId,
    "Olá! Respondemos sua dúvida sobre banho. Confira!"
);
```

---

## 🏗️ Arquitetura

### Backend

```
backend/src/
├── services/
│   └── notificationService.ts     # ⭐ Serviço principal
├── controllers/
│   └── cronController.ts          # Vercel Cron handler
├── routes/
│   └── cronRoutes.ts              # Rota /api/cron/notifications
└── index.ts                       # Inicia scheduler
```

### Fluxo de Execução

```
┌─────────────────┐
│  Vercel Cron    │ (Produção)
│  Every minute   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ POST /api/cron/         │
│      notifications      │
│ (Bearer auth)           │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ runScheduledNotifications│
│ - notify30MinBefore()   │
│ - notifyDailyReview()   │
└─────────────────────────┘


┌─────────────────┐
│  setInterval    │ (Desenvolvimento)
│  Every 60s      │
└────────┬────────┘
         │
         ▼
    (same flow)
```

---

## ⚙️ Configuração

### 1. **Vercel Environment Variables**

Adicione no Vercel Dashboard:

```env
CRON_SECRET=gere-um-token-aleatorio-aqui
```

**Como gerar**:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. **vercel.json**

Já configurado:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "* * * * *"
    }
  ]
}
```

**Schedule Format**: `* * * * *` = Every minute

- Minuto | Hora | Dia do Mês | Mês | Dia da Semana

---

## 🧪 Como Testar

### Localmente (Desenvolvimento)

1. **Inicie o backend**:

```bash
cd backend
npm run dev
```

1. **O scheduler inicia automaticamente** e roda a cada 60 segundos

2. **Logs no console**:

```
[Notif Scheduler] Running scheduled checks...
[Notif Scheduler] ✅ 3 agendamentos notificados (30min)
[Notif Scheduler] ✅ 5 operadores notificados (revisão diária)
```

### Produção (Vercel)

1. **Deploy no Vercel**
2. **Configure `CRON_SECRET` nas env vars**
3. **Vercel executa automaticamente** a cada minuto
4. **Logs**: Ver em Vercel Dashboard → Functions → Logs

---

## 📊 Model de Notification

```prisma
model Notification {
  id         String    @id @default(uuid())
  userId     String
  title      String
  message    String
  type       String    // 'APPOINTMENT_REMINDER', 'DAILY_REVIEW', etc.
  read       Boolean   @default(false)
  createdAt  DateTime  @default(now())
  metadata   Json?     // Dados adicionais
  priority   String?   @default("LOW") // LOW, MEDIUM, HIGH
  relatedId  String?   // appointmentId, quoteId, etc.
  resolved   Boolean   @default(false)
  resolvedAt DateTime?
  resolvedBy String?
  user       User      @relation(fields: [userId], references: [id])
}
```

---

## 🎯 Como Integrar em Novos Fluxos

### Exemplo: Notificar quando orçamento é aprovado

```typescript
// Em quoteController.ts - método updateStatus

if (newStatus === 'APROVADO') {
    // Atualiza status...
    
    // ✅ ADICIONE AQUI:
    await notificationService.notifyQuoteResponse(
        quoteId,
        quote.customer.userId,
        `Parabéns! Seu orçamento foi aprovado. Total: R$ ${quote.totalAmount.toFixed(2)}`
    );
}
```

### Exemplo: Notificar quando agendamento é confirmado

```typescript
// Em appointmentController.ts - método updateStatus

if (status === 'CONFIRMADO') {
    // Atualiza status...
    
    // ✅ ADICIONE AQUI:
    await notificationService.notifyAppointmentChange(
        appointmentId,
        appointment.customer.userId,
        'CONFIRM',
        `Seu agendamento para ${appointment.pet.name} foi confirmado! 🎉`
    );
}
```

---

## 🔐 Segurança

### Bearer Token no Cron

```typescript
// Vercel envia automaticamente:
Authorization: Bearer {CRON_SECRET}
```

**Verificação no código**:

```typescript
const authHeader = req.headers.authorization;
const cronSecret = process.env.CRON_SECRET;

if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
}
```

---

## 📝 Próximos Passos (Opcional)

- [ ] **Frontend**: Exibir notificações em tempo real
- [ ] **Push Notifications**: Integrar com Firebase Cloud Messaging
- [ ] **Email**: Enviar emails para notificações importantes
- [ ] **WhatsApp**: Integrar API do WhatsApp Business
- [ ] **Histórico**: Página de histórico de notificações
- [ ] **Preferências**: Cliente configurar quais notificações quer receber

---

## 📂 Arquivos Criados/Modificados

### Novos

1. `backend/src/services/notificationService.ts` ⭐
2. `backend/src/controllers/cronController.ts`
3. `backend/src/routes/cronRoutes.ts`
4. `backend/.env.example`
5. `NOTIFICATIONS_SYSTEM.md` (este arquivo)

### Modificados

6. `backend/src/index.ts` - Adicionado `startNotificationScheduler()`
2. `vercel.json` - Adicionado cron job configuration

---

**Status**: ✅ **Sistema implementado e pronto para uso!**  
**Dev**: Funciona localmente (setInterval)  
**Prod**: Funciona no Vercel (Cron Jobs)

**Próximo**: Integrar chamadas de notificação nos controllers existentes
