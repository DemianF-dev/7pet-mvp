# Sistema de Lixeira de Agendamentos

## Visão Geral
Sistema de soft delete e recuperação de agendamentos, permitindo que operadores movam agendamentos para a lixeira e os restaurem preservando o status original.

## Funcionalidades

### 1. **Soft Delete (Lixeira)**
- Agendamentos deletados são marcados com `deletedAt` (não removidos do banco)
- Permanecem na lixeira por 15 dias antes da limpeza automática
- Status original é preservado para restauração

### 2. **Restauração**
- Agendamentos podem ser restaurados individualmente ou em massa
- Status original é mantido automaticamente
- Histórico de auditoria preservado

### 3. **Exclusão Permanente**
- Disponível apenas para agendamentos na lixeira
- Remove permanentemente do banco de dados
- Ação irreversível

## Interface do Usuário

### Abas
- **Ativos**: Agendamentos normais (deletedAt = null)
- **Lixeira**: Agendamentos deletados nos últimos 15 dias

### Ações em Massa (Ativos)
- Selecionar: Modo de seleção múltipla
- Mover para Lixeira: Soft delete de múltiplos agendamentos

### Ações em Massa (Lixeira)
- Restaurar: Restaura agendamentos selecionados ao status original
- Excluir Permanente: Remove permanentemente (hard delete)

## Endpoints API

### Soft Delete (Bulk)
```http
POST /appointments/bulk-delete
Body: { "ids": ["uuid1", "uuid2", ...] }
```
**Ação**: Atualiza `deletedAt` para data atual

### Restauração (Bulk)
```http
POST /appointments/bulk-restore
Body: { "ids": ["uuid1", "uuid2", ...] }
```
**Ação**: Define `deletedAt` como `null`, preservando outros campos

### Listar Lixeira
```http
GET /appointments/trash
```
**Retorna**: Agendamentos com `deletedAt` nos últimos 15 dias

### Exclusão Permanente (Individual)
```http
DELETE /appointments/:id/permanent
```
**Ação**: Hard delete do banco de dados

## Comportamentos Importantes

### Preservação do Status
Quando um agendamento é restaurado, ele volta exatamente como estava antes de ser deletado:
- Status (PENDENTE, CONFIRMADO, etc.)
- Data/hora
- Serviços
- Cliente e Pet
- Profissional responsável

### Filtros Automáticos
- **Listagem de Ativos**: Automaticamente filtra `deletedAt IS NULL`
- **Listagem de Lixeira**: Automaticamente filtra `deletedAt IS NOT NULL`
- **Categoria**: Apenas SPA em AgendaSPA, apenas LOGISTICA em AgendaLOG

### Janela de Recuperação
- 15 dias de retenção na lixeira
- Após 15 dias, agendamentos são automaticamente removidos da listagem (mas ainda existem no banco)
- Considera-se implementar limpeza automática após 30-90 dias

## Casos de Uso

### Caso 1: Agendamento cancelado por engano
**Situação**: Operador clicou em deletar ou executou ação em massa sem querer  
**Solução**: Ir na lixeira e restaurar o agendamento

### Caso 2: Limpeza de agendamentos antigos
**Situação**: Múltiplos agendamentos finalizados há muito tempo  
**Solução**: Mover para lixeira, revisar, e excluir permanentemente se necessário

### Caso 3: Cliente mudou de ideia
**Situação**: Agendamento foi cancelado mas cliente retornou  
**Solução**: Restaurar da lixeira em vez de criar novo

## Diferenças entre Agendas

### AgendaSPA
- Cor primária: Azul (`bg-primary`)
- Categoria filtrada: `SPA`
- Ícone novo item: Plus

### AgendaLOG
- Cor primária: Laranja (`bg-orange-500`)
- Categoria filtrada: `LOGISTICA`
- Terminologia: "Item de Logística"

## Código Técnico

### Soft Delete Implementation
```typescript
// Service Layer
export const bulkDelete = async (ids: string[]) => {
    return prisma.appointment.updateMany({
        where: { 
            id: { in: ids },
            deletedAt: null
        },
        data: { deletedAt: new Date() }
    });
};
```

### Bulk Restore Implementation
```typescript
export const bulkRestore = async (ids: string[]) => {
    return prisma.appointment.updateMany({
        where: { 
            id: { in: ids },
            deletedAt: { not: null }
        },
        data: { deletedAt: null }
    });
};
```

### Frontend Tab State
```tsx
const [tab, setTab] = useState<TabType>('active');

const fetchAppointments = async () => {
    const endpoint = tab === 'trash' 
        ? '/appointments/trash' 
        : '/appointments?category=SPA';
    const response = await api.get(endpoint);
    setAppointments(response.data);
};

useEffect(() => {
    fetchAppointments();
}, [tab]); // Refetch when tab changes
```

## Melhorias Futuras

1. **Auto-limpeza**: Cron job para deletar permanentemente após 90 dias
2. **Filtros de data**: Permitir ver agendamentos deletados em períodos específicos
3. **Motivo de exclusão**: Campo para registrar por que foi deletado
4. **Notificações**: Alertar quando agendamento importante está próximo de ser removido permanentemente
5. **Permissões**: Diferentes níveis de acesso para restauração vs exclusão permanente
