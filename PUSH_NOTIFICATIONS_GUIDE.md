# 🔔 Guia de Implementação - Push Notifications Backend

## 📋 **Pré-requisitos**

Para enviar Push Notifications, você precisa:

1. **VAPID Keys** (Voluntary Application Server Identification)
2. **Endpoint no backend** para salvar subscriptions
3. **Serviço para enviar notificações**

---

## 🚀 **Passo 1: Gerar VAPID Keys**

### Instalar dependência

```bash
cd backend
npm install web-push
```

### Gerar as keys

```bash
npx web-push generate-vapid-keys
```

**Saída:**

```
=======================================

Public Key:
BGty...xyz123

Private Key:
abc...789xyz

=======================================
```

### Adicionar ao `.env`

```env
VAPID_PUBLIC_KEY=BGty...xyz123
VAPID_PRIVATE_KEY=abc...789xyz
VAPID_SUBJECT=mailto:seu@email.com
```

---

## 🔧 **Passo 2: Criar Schema Prisma**

### Adicionar ao `schema.prisma`

```prisma
model PushSubscription {
  id String @id @default(uuid())
  
  userId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  endpoint String
  p256dh String
  auth String
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, endpoint])
  @@index([userId])
}

// Adicionar ao modelo User:
model User {
  // ... campos existentes
  pushSubscriptions PushSubscription[]
}
```

### Rodar migration

```bash
npx prisma migrate dev --name add_push_subscriptions
```

---

## 📝 **Passo 3: Criar Controller**

### Criar `backend/src/controllers/notificationController.ts`

```typescript
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import webPush from 'web-push';

// Configurar VAPID
webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contato@7pet.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

// Salvar subscription
export const subscribe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { endpoint, keys } = req.body;

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ error: 'Dados de subscription inválidos' });
        }

        await prisma.pushSubscription.upsert({
            where: {
                userId_endpoint: {
                    userId,
                    endpoint
                }
            },
            create: {
                userId,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth
            },
            update: {
                p256dh: keys.p256dh,
                auth: keys.auth
            }
        });

        res.json({ message: 'Subscription salva com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar subscription:', error);
        res.status(500).json({ error: 'Erro ao salvar subscription' });
    }
};

// Remover subscription
export const unsubscribe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { endpoint } = req.body;

        await prisma.pushSubscription.delete({
            where: {
                userId_endpoint: {
                    userId,
                    endpoint
                }
            }
        });

        res.json({ message: 'Subscription removida com sucesso' });
    } catch (error) {
        console.error('Erro ao remover subscription:', error);
        res.status(500).json({ error: 'Erro ao remover subscription' });
    }
};

// Enviar notificação para um usuário
export const sendNotification = async (userId: string, payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
}) => {
    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        });

        const notificationPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/pwa-192x192.png',
            badge: payload.badge || '/pwa-192x192.png',
            data: payload.data
        });

        const promises = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            return webPush.sendNotification(pushSubscription, notificationPayload)
                .catch(async error => {
                    console.error('Erro ao enviar notificação:', error);
                    
                    // Se subscription expirou, remover do banco
                    if (error.statusCode === 410) {
                        await prisma.pushSubscription.delete({
                            where: { id: sub.id }
                        });
                    }
                });
        });

        await Promise.all(promises);
        console.log(`Notificações enviadas para usuário ${userId}`);
    } catch (error) {
        console.error('Erro ao enviar notificações:', error);
    }
};

// Enviar notificação para múltiplos usuários
export const sendBulkNotification = async (userIds: string[], payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
}) => {
    const promises = userIds.map(userId => sendNotification(userId, payload));
    await Promise.all(promises);
};
```

---

## 🛣️ **Passo 4: Criar Rotas**

### Criar `backend/src/routes/notificationRoutes.ts`

```typescript
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import * as notificationController from '../controllers/notificationController';

const router = Router();

router.use(authenticate);

router.post('/subscribe', notificationController.subscribe);
router.post('/unsubscribe', notificationController.unsubscribe);

export default router;
```

### Adicionar ao `backend/src/server.ts`

```typescript
import notificationRoutes from './routes/notificationRoutes';

// ...

app.use('/api/notifications', notificationRoutes);
```

---

## 📤 **Passo 5: Usar Notificações**

### Exemplo: Enviar notificação quando agendamento é criado

```typescript
// Em appointmentController.ts

import { sendNotification } from './notificationController';

export const createAppointment = async (req: Request, res: Response) => {
    // ... criar agendamento

    const appointment = await prisma.appointment.create({
        data: appointmentData
    });

    // Enviar notificação para o profissional
    if (appointment.professionalId) {
        await sendNotification(appointment.professionalId, {
            title: 'Novo Agendamento! 📅',
            body: `Você tem um novo serviço agendado para ${format(appointment.startAt, 'dd/MM/yyyy HH:mm')}`,
            data: {
                appointmentId: appointment.id,
                url: '/staff/kanban'
            }
        });
    }

    // Enviar notificação para o cliente
    await sendNotification(appointment.customerId, {
        title: 'Agendamento Confirmado! ✅',
        body: `Seu agendamento para ${format(appointment.startAt, 'dd/MM/yyyy HH:mm')} foi confirmado!`,
        data: {
            appointmentId: appointment.id,
            url: '/appointments'
        }
    });

    res.status(201).json(appointment);
};
```

---

## 🎯 **Passo 6: Atualizar Frontend**

### Atualizar `usePushNotifications.ts`

Trocar:

```typescript
const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY_HERE';
```

Por:

```typescript
const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
```

### Criar `.env` no frontend

```env
VITE_VAPID_PUBLIC_KEY=BGty...xyz123
```

### Atualizar `saveSubscriptionToBackend`

```typescript
const saveSubscriptionToBackend = async (subscription: PushSubscription) => {
    try {
        await api.post('/notifications/subscribe', {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.toJSON().keys?.p256dh,
                auth: subscription.toJSON().keys?.auth
            }
        });
        console.log('Subscription salva no servidor');
    } catch (error) {
        console.error('Erro ao salvar subscription:', error);
    }
};
```

---

## ✅ **Checklist de Implementação**

- [ ] Instalar `web-push` no backend
- [ ] Gerar VAPID keys
- [ ] Adicionar keys ao `.env`
- [ ] Criar model `PushSubscription` no Prisma
- [ ] Rodar migration
- [ ] Criar `notificationController.ts`
- [ ] Criar `notificationRoutes.ts`
- [ ] Registrar rotas no `server.ts`
- [ ] Atualizar `.env` do frontend com VAPID public key
- [ ] Atualizar `usePushNotifications.ts`
- [ ] Testar subscription
- [ ] Testar envio de notificações

---

## 🎉 **Uso em Produção**

Exemplos de quando enviar notificações:

### 1. **Agendamentos**

- ✅ Novo agendamento criado
- 📅 Lembrete 1 dia antes
- ⏰ Lembrete 1 hora antes
- ✅ Agendamento concluído

### 2. **Orçamentos**

- 💰 Novo orçamento recebido
- ✅ Orçamento aprovado
- ❌ Orçamento rejeitado

### 3. **Pagamentos**

- 💳 Pagamento confirmado
- ⚠️ Pagamento pendente

### 4. **Sistema**

- 🔔 Notificação geral
- ⚠️ Alertas importantes

---

## 🔐 **Segurança**

1. **SEMPRE** valide que o usuário pode receber a notificação
2. **NUNCA** envie dados sensíveis no payload
3. **Use** HTTPS em produção (obrigatório para PWA)
4. **Implemente** rate limiting para prevenir spam
5. **Respeite** a preferência do usuário (permitir desativar)

---

## 📊 **Monitoramento**

Adicione logs para:

- Total de subscriptions ativas
- Taxa de sucesso/falha de envio
- Subscriptions expiradas removidas
- Notificações enviadas por usuário

---

**Pronto!** 🚀 Com essa implementação, seu sistema terá Push Notifications completas!
