# 🧪 GUIA DE TESTES - Features Implementadas

## ✅ Pré-requisitos

- ✅ Backend rodando em `http://localhost:3001`
- ✅ Frontend rodando em `http://localhost:5173`
- ✅ Migrations aplicadas (`npx prisma db push` - ✅ DONE)

---

## 🧪 TESTE 1: Sistema de Parasitas (Orçamentos)

### Objetivo

Verificar se a seção de parasitas aparece corretamente e o custo do banho medicamentoso é calculado.

### Passos

1. **Acesse**: `http://localhost:5173/client/quote-request`

2. **Faça login como CLIENTE** (se necessário)

3. **Selecione o tipo de serviço**: SPA (ou SPA_TRANSPORTE)

4. **Escolha um pet** e tipo de pelo

5. **Na seção SPA**, procure por **"Presença de Parasitas?"**

6. **Marque o toggle** para SIM (deve ficar vermelho)

### ✅ Validações

- [ ] Ao marcar "SIM", uma seção expandida deve aparecer com animação
- [ ] Deve ter 3 botões: **PULGA**, **CARRAPATO**, **AMBOS**
- [ ] Deve ter um campo de texto (textarea) para comentários
- [ ] Deve ter um toggle: **"💊 Banho Medicamentoso Antipulgas?"**

1. **Selecione um tipo de parasita** (ex: PULGA)
   - [ ] O botão deve ficar vermelho quando selecionado

2. **Digite um comentário** (ex: "Pulgas no pescoço e orelhas")
   - [ ] O texto deve aparecer no campo

3. **Marque "Banho Medicamentoso"** (toggle para SIM)

### ✅ Validações Importantes

- [ ] Deve aparecer uma caixa verde com: **"R$ 45,00 será adicionado ao orçamento"**
- [ ] O design deve ser verde (confirmação positiva)

1. **Complete o orçamento** e envie

2. **Verifique no backend** (database ou API):
    - [ ] Campo `hasParasites` = true
    - [ ] Campo `parasiteTypes` = "PULGA" (ou outro)
    - [ ] Campo `parasiteComments` = seu comentário
    - [ ] Campo `wantsMedicatedBath` = true
    - [ ] Deve ter um item: "💊 Banho Medicamentoso Antipulgas" por R$ 45,00

### 🔍 Como verificar no backend

**Opção 1 - Via API**:

```bash
# Get all quotes
curl http://localhost:3001/quotes -H "Authorization: Bearer SEU_TOKEN"
```

**Opção 2 - Prisma Studio**:

```bash
cd backend
npx prisma studio
```

Veja a tabela `Quote` e verifique os novos campos.

---

## 🧪 TESTE 2: Notificações 30min Antes

### Objetivo

Verificar se o sistema cria notificações 30 minutos antes de um agendamento.

### Passos

1. **Crie um agendamento para daqui 30 minutos**:
   - Horário atual: `{{HORA_ATUAL}}`
   - Agende para: `{{HORA_ATUAL + 30min}}`

2. **Use status**: CONFIRMADO (ou PENDENTE)

3. **Aguarde o scheduler rodar** (roda a cada 60 segundos)

4. **Verifique os logs do backend**:

```
[Notif Scheduler] Running scheduled checks...
[Notif Scheduler] ✅ 1 agendamentos notificados (30min)
```

### ✅ Validações

**No banco de dados** (Prisma Studio ou API):

- [ ] Deve ter 1 notificação para o **CLIENTE**
  - Tipo: `APPOINTMENT_REMINDER`
  - Título: "🐾 Agendamento em 30 minutos!"
  - Prioridade: HIGH

- [ ] Deve ter notificações para **OPERADORES/GERENTES**
  - Tipo: `APPOINTMENT_STAFF_REMINDER`
  - Título: "📋 Agendamento iniciando em 30min"

- [ ] Se houver `performerId`, deve ter notificação para o **PROFISSIONAL**
  - Tipo: `APPOINTMENT_PERFORMER_REMINDER`
  - Título: "⭐ Seu agendamento é em 30min!"

### 🔍 Como verificar notificações

**Via API**:

```bash
# Get notifications para um user
curl http://localhost:3001/notifications -H "Authorization: Bearer TOKEN_DO_USER"
```

**Via Prisma Studio**:

```bash
cd backend
npx prisma studio
```

Veja a tabela `Notification`.

---

## 🧪 TESTE 3: Notificação Diária às 22:00

### Objetivo

Verificar se às 22:00 todos os operadores recebem "Revise sua agenda de amanhã!"

### Passos

⚠️ **Este teste só funciona às 22:00!**

1. **Aguarde até 22:00**

2. **O scheduler deve rodar automaticamente** entre 22:00 e 22:05

3. **Verifique os logs**:

```
[Notif Scheduler] ✅ 5 operadores notificados (revisão diária)
```

### ✅ Validações

- [ ] Todos os users com role `OPERACIONAL`, `GESTAO`, `ADMIN`, `SPA`, `MASTER` devem receber
- [ ] Tipo: `DAILY_REVIEW`
- [ ] Título: "📅 Atenção! Revise sua agenda de amanhã"
- [ ] Mensagem deve incluir a contagem de agendamentos de amanhã

### 🔧 Teste Manual (não precisa esperar 22:00)

**Execute manualmente via código**:

```typescript
// No backend, criar endpoint temporário:
app.get('/test/daily-review', async (req, res) => {
    await notificationService.notifyDailyReview();
    res.json({ ok: true });
});
```

Acesse: `http://localhost:3001/test/daily-review`

---

## 🧪 TESTE 4: Notificação de Orçamento Respondido

### Objetivo

Cliente recebe notificação quando staff responde um orçamento.

### Passos

1. **Como CLIENTE**, crie um orçamento

2. **Como STAFF** (ADMIN/GESTAO), responda o orçamento:
   - Mude o status para `APROVADO` ou `PROCESSANDO`
   - Adicione valores/itens

3. **No código do backend**, adicione a chamada:

```typescript
// Em quoteController.ts - updateStatus
await notificationService.notifyQuoteResponse(
    quoteId,
    quote.customer.userId,
    `Seu orçamento foi respondido! Total: R$ ${quote.totalAmount}`
);
```

### ✅ Validações

- [ ] Cliente recebe notificação
- [ ] Tipo: `QUOTE_RESPONSE`
- [ ] Título: "💰 Orçamento Respondido!"
- [ ] Prioridade: HIGH

---

## 🧪 TESTE 5: Notificação de Alteração em Agendamento

### Objetivo

Cliente recebe notificação quando agendamento é alterado.

### Passos

1. **Crie um agendamento como CLIENTE**

2. **Como STAFF**, altere o agendamento:
   - Mude horário, serviços, etc.

3. **No código**, adicione:

```typescript
// Em appointmentController.ts - update
await notificationService.notifyAppointmentChange(
    appointmentId,
    appointment.customer.userId,
    'UPDATE',
    `Seu agendamento foi reagendado para ${newDate}`
);
```

### ✅ Validações

- [ ] Cliente recebe notificação
- [ ] Tipo: `APPOINTMENT_UPDATE`
- [ ] Título: "🔄 Agendamento Alterado"

---

## 📊 Checklist Geral de Testes

### Sistema de Parasitas

- [ ] UI aparece corretamente
- [ ] Seleção de tipo funciona
- [ ] Campo de comentários funciona
- [ ] Toggle de banho medicamentoso funciona
- [ ] Custo R$ 45,00 é mostrado
- [ ] Dados são salvos no banco corretamente
- [ ] Item é adicionado ao totalAmount

### Sistema de Notificações

- [ ] Scheduler inicia automaticamente no backend
- [ ] Logs aparecem no console
- [ ] Notificação 30min antes funciona
- [ ] Notificação às 22:00 funciona (ou teste manual)
- [ ] Notificações são criadas no banco
- [ ] Campos corretos (title, message, type, priority)

### Performance

- [ ] Backend responde rápido (< 500ms)
- [ ] Frontend carrega sem erros
- [ ] Não há erros no console

---

## 🐛 Troubleshooting

### Erro: "parasiteTypes is not defined"

**Solução**: Execute `npx prisma db push` no backend

### Erro: "notificationService is not defined"

**Solução**: Verifique se o import está correto no index.ts

### Scheduler não roda

**Solução**:

1. Verifique se `NODE_ENV !== 'production'`
2. Veja os logs do backend ao iniciar
3. Deve aparecer: `[Notif Scheduler] Started (runs every 60s in dev)`

### Notificações não aparecem

**Solução**:

1. Verifique se o agendamento está CONFIRMADO ou PENDENTE
2. Verifique se o horário está correto (30min no futuro)
3. Aguarde até 60 segundos para o scheduler rodar

---

---

## 🧪 TESTE 6: Validação de Data Passada (Smart Date Validation) ✨

### Objetivo

Verificar se o sistema bloqueia clientes de agendar no passado e exige confirmação de Staff.

### Passos (Como CLIENTE)

1. **Acesse**: Agendamento de Serviço
2. **Tente selecionar** uma data e hora que JÁ PASSOU (Ex: ontem ou hoje 1h atrás)
3. **Tente confirmar**

### ✅ Validações (Cliente)

- [ ] O sistema deve exibir erro: "Não é possível agendar para uma data que já passou"
- [ ] O agendamento NÃO deve ser criado

### Passos (Como STAFF - Colaborador)

1. **Acesse**: Agenda (Kanban ou Transporte)
2. **Clique em "+ Novo Agendamento"**
3. **Selecione uma data PASSADA** (Ex: Ontem)
4. **Clique em "Confirmar Agendamento"**

### ✅ Validações (Staff)

- [ ] Deve aparecer um modal especial: **"Confirmar Data Passada"** ⚠️
- [ ] O modal deve mostrar a data escolhida e avisar que está no passado
- [ ] Clique em **"Cancelar"** → Deve voltar ao formulário (nada acontece)
- [ ] Clique em **"Sim, Confirmar"** → O sistema deve criar o agendamento retroativo

---

## 🧪 TESTE 7: Notificações Multicanal (WhatsApp/Email Stub) 📱️📧

### Objetivo

Verificar se as notificações estão sendo roteadas para o messagingService.

### Passos

1. **Ative preferências do cliente**:
   - Vá ao perfil do cliente (via Prisma Studio ou Editar Perfil)
   - Mude `communicationPrefs` para `["WHATSAPP", "EMAIL", "APP"]`
   - Certifique-se que o cliente tem Telefone e Email preenchidos.

2. **Gatilhe qualquer notificação reativa**:
   - Staff respondendo orçamento
   - Staff confirmando agendamento
   - Staff respondendo chamado técnico

### ✅ Validações

- [ ] Verifique os logs do backend:

```
[MessagingService] Request to send WhatsApp to +5511...: "*💰 Orçamento Respondido!*..."
[MessagingService] Request to send Email to cliente@...: "💰 Orçamento Respondido!"
```

- [ ] Verifique no banco se a notificação do tipo `APP` (Database) foi criada.

---

## 🧪 TESTE 8: Visibilidade de Senha Master 🔐

### Objetivo

Verificar se apenas o usuário Master (`oidemianf@gmail.com`) consegue visualizar as senhas em texto puro.

### Passos

1. **Faça login como MASTER**: Use o email `oidemianf@gmail.com`.
2. **Navegue até**: Gestão > Usuários (`/staff/management/users`).
3. **Verifique a tabela**:
    - [ ] Deve haver uma coluna extra (com ícone de cadeado) mostrando a senha original.
4. **Abra o modal de edição** de qualquer usuário:
    - [ ] O campo "Senha Original (Recuperação)" deve estar visível com a senha.

5. **Faça login como outro ADMIN** (ex: qualquer outro email com role ADMIN):
6. **Navegue até**: Gestão > Usuários.
7. **Verifique a tabela**:
    - [ ] A coluna de senha original NÃO deve aparecer.
8. **Abra o modal de edição**:
    - [ ] O campo de senha original NÃO deve aparecer.

### ✅ Validações de Segurança (API)

- [ ] Tente acessar `GET http://localhost:3001/management/users` com o token do Master: deve conter `plainPassword`.
- [ ] Tente acessar `GET http://localhost:3001/management/users` com o token de outro Admin: o campo `plainPassword` deve estar AUSENTE no JSON.

---

## 🧪 TESTE 9: Preenchimento Automático de Endereço 🏠

### Objetivo

Verificar se o endereço cadastrado do cliente preenche automaticamente os campos de transporte no orçamento.

### Passos

1. **Certifique-se** que seu usuário cliente tem um endereço cadastrado.
2. **Acesse**: `http://localhost:5173/client/quote-request`.
3. **Selecione**: TRANSPORTE ou SPA_TRANSPORTE.
4. **Verifique a seção de transporte**:
    - [ ] O campo **Origem** deve estar preenchido com seu endereço.
    - [ ] O campo **Endereço de Retorno** deve estar preenchido com seu endereço.

### ✅ Validações

- [ ] O preenchimento deve ocorrer apenas se os campos estiverem vazios ao carregar.
- [ ] Você deve conseguir apagar e digitar um endereço diferente manualmente.
- [ ] Se o endereço manual for digitado, ele NÃO deve ser sobrescrito pelo automático novamente.

---

## ✅ Quando Passar em Todos os Testes

1. ✅ Documente qualquer bug encontrado
2. ✅ Faça ajustes se necessário
3. ✅ **TUDO PRONTO PARA O COMMIT FINAL!** 🚀

---

**Implementado por**: Antigravity AI  
**Data**: 03/01/2026 23:05
