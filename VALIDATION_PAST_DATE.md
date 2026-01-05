# 🔒 VALIDAÇÃO DE DATA PASSADA - Documentação

## 📋 Resumo

Sistema de validação que impede agendamentos em datas/horários passados, mas permite confirmação explícita por operadores staff.

---

## ✅ O QUE FOI IMPLEMENTADO

### **Backend** (`appointmentService.ts`)

```typescript
// Nova interface com flag de confirmação
{
    ...appointmentData,
    overridePastDateCheck?: boolean // Staff confirma agendamento no passado
}

// Validação automática
if (startAt < now) {
    if (!isStaff) {
        // CLIENTES: Bloqueio total
        throw new Error('Não é possível agendar para uma data que já passou');
    } else if (!overridePastDateCheck) {
        // STAFF: Retorna erro especial com código
        error.code = 'PAST_DATE_WARNING';
        throw error;
    }
    // isStaff + overridePastDateCheck = true → permite
}
```

---

### **Backend** (`appointmentController.ts`)

```typescript
// Captura erro especial e retorna JSON específico
if (error.code === 'PAST_DATE_WARNING') {
    return res.status(400).json({ 
        error: error.message,
        code: 'PAST_DATE_WARNING',
        appointmentDate: error.appointmentDate,
        requiresConfirmation: true
    });
}
```

---

### **Frontend** (`PastDateConfirmModal.tsx`)

Modal bonito e profissional que:

- ✅ Mostra a data/hora que está no passado
- ✅ Avisa que é incomum
- ✅ Pede confirmação explícita
- ✅ Oferece 2 botões: "Cancelar" e "Sim, Confirmar"

**Design**:

- Borda laranja (warning)
- Ícone de alerta
- Data/hora grande e clara
- Texto explicativo

---

## 🔄 FLUXO COMPLETO

### Para CLIENTES

```
1. Cliente tenta agendar para data passada
   ↓
2. Backend retorna erro imediatamente
   ↓
3. Frontend mostra: "Não é possível agendar para data que já passou"
   ↓
4. End (bloqueado)
```

### Para STAFF (Operadores)

```
1. Staff tenta agendar para data passada (sem override)
   ↓
2. Backend retorna erro com code='PAST_DATE_WARNING'
   ↓
3. Frontend detecta o código especial
   ↓
4. Mostra PastDateConfirmModal
   ↓
5. Staff escolhe:
   
   ➡️ Cancelar → volta ao formulário
   
   ➡️ Confirmar → reenvia com overridePastDateCheck=true
                 → Backend permite
                 → Agendamento criado
```

---

## 📝 INTEGRAÇÃO NO FRONTEND

### No `AppointmentFormModal.tsx`

```typescript
const [showPastDateModal, setShowPastDateModal] = useState(false);
const [pendingSubmitData, setPendingSubmitData] = useState(null);

// No handleSubmit, capturar erro específico:
catch (error: any) {
    if (error.response?.data?.code === 'PAST_DATE_WARNING') {
        // Salvar dados para reenvio posterior
        setPendingSubmitData(dataToSend);
        setShowPastDateModal(true);
        return; // Não mostra erro ainda
    }
    alert(error.response?.data?.error || 'Erro...');
}

// Handler de confirmação:
const handleConfirmPastDate = async () => {
    setShowPastDateModal(false);
    // Reenviar com flag
    const dataWithOverride = {
        ...pendingSubmitData,
        overridePastDateCheck: true
    };
    await api.post('/appointments', dataWithOverride);
    onSuccess();
};

// No JSX:
<PastDateConfirmModal
    isOpen={showPastDateModal}
    appointmentDate={pendingSubmitData?.appointmentDate}
    onConfirm={handleConfirmPastDate}
    onCancel={() => {
        setShowPastDateModal(false);
        setPendingSubmitData(null);
    }}
/>
```

---

## 🧪 CASOS DE TESTE

### Teste 1: Cliente tenta agendar no passado

**Esperado**: Erro imediato, sem modal

### Teste 2: Staff tenta agendar no passado (primeira vez)

**Esperado**: Modal de confirmação aparece

### Teste 3: Staff confirma agendamento passado

**Esperado**: Agendamento é criado com sucesso

### Teste 4: Staff cancela confirmação

**Esperado**: Volta ao formulário, dados preservados

### Teste 5: Agendamento futuro

**Esperado**: Nenhuma validação, cria normalmente

---

## 📂 ARQUIVOS CRIADOS/MODIFICADOS

### Criados

1. `frontend/src/components/PastDateConfirmModal.tsx` ✨

### Modificados

2. `backend/src/services/appointmentService.ts`
2. `backend/src/controllers/appointmentController.ts`
3. `VALIDATION_PAST_DATE.md` (este arquivo)

---

## ⚠️ IMPORTANTE

### Para completar a implementação

**PRÓXIMO PASSO**: Integrar `PastDateConfirmModal` no `AppointmentFormModal.tsx`

**O que falta**:

- [ ] Adicionar useState para controlar o modal
- [ ] Capturar erro PAST_DATE_WARNING
- [ ] Mostrar modal quando detectado
- [ ] Reenviar com override quando confirmado

**Código pronto** está neste arquivo (`VALIDATION_PAST_DATE.md`) na seção "INTEGRAÇÃO NO FRONTEND".

---

## 🎯 STATUS

**Backend**: ✅ 100% Implementado  
**Frontend**: ⚠️ 80% (modal criado, falta integrar)

**Para testar**: Após integrar no `AppointmentFormModal`, tente criar um agendamento para ontem como staff.

---

**Implementado por**: Antigravity AI  
**Data**: 03/01/2026 22:30
