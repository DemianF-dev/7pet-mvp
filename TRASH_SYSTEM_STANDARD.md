# Padrão de Implementação de Sistema de Lixeira

## Objetivo
Este documento define o padrão inquestionável para implementação de sistemas de lixeira (soft delete) em toda a aplicação 7Pet.

## Princípios Fundamentais

### 1. **Soft Delete Always** ⚠️ CRÍTICO
- NUNCA usar hard delete direto
- SEMPRE usar soft delete (campo `deletedAt`)
- Hard delete APENAS após confirmação explícita

### 2. **Preservação de Dados**
- Status original preservado
- Todas as relações preservadas
- Histórico de auditoria mantido

### 3. **Recovery Window**
- Mínimo de 15 dias na lixeira
- Máximo de 90 dias antes de limpeza automática
- Proteção contra exclusão prematura

## Padrão de Implementação

### Backend

#### Schema Prisma
```prisma
model Entity {
  id        String    @id @default(uuid())
  // ... outros campos ...
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

#### Service Layer (`entityService.ts`)
```typescript
// Soft Delete Individual
export const remove = async (id: string) => {
    return prisma.entity.update({
        where: { id },
        data: { deletedAt: new Date() }
    });
};

// Soft Delete em Massa
export const bulkDelete = async (ids: string[]) => {
    return prisma.entity.updateMany({
        where: { 
            id: { in: ids },
            deletedAt: null // Apenas ativos
        },
        data: { deletedAt: new Date() }
    });
};

// Restaurar Individual
export const restore = async (id: string) => {
    return prisma.entity.update({
        where: { id },
        data: { deletedAt: null }
    });
};

// Restaurar em Massa
export const bulkRestore = async (ids: string[]) => {
    return prisma.entity.updateMany({
        where: { 
            id: { in: ids },
            deletedAt: { not: null } // Apenas deletados
        },
        data: { deletedAt: null }
    });
};

// Listar Lixeira
export const listTrash = async () => {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - 15);
    
    return prisma.entity.findMany({
        where: {
            deletedAt: {
                not: null,
                gte: retentionDate // Últimos 15 dias
            }
        },
        include: { /* relações necessárias */ },
        orderBy: { deletedAt: 'desc' }
    });
};

// Hard Delete (APENAS após verificação)
export const permanentRemove = async (id: string) => {
    // Verificar se está na lixeira
    const entity = await prisma.entity.findUnique({ where: { id } });
    if (!entity?.deletedAt) {
        throw new Error('Item deve estar na lixeira antes de exclusão permanente');
    }
    
    // Opcional: Proteção de tempo mínimo (ex: 7 dias)
    const minDays = 7;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - minDays);
    
    if (entity.deletedAt > minDate) {
        throw new Error(`Item deve estar na lixeira por pelo menos ${minDays} dias`);
    }
    
    return prisma.entity.delete({ where: { id } });
};
```

#### Controller Layer (`entityController.ts`)
```typescript
export const bulkDelete = async (req: any, res: Response) => {
    try {
        if (req.user.role === 'CLIENTE') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const { ids } = req.body;
        await entityService.bulkDelete(ids);
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const bulkRestore = async (req: any, res: Response) => {
    try {
        if (req.user.role === 'CLIENTE') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const { ids } = req.body;
        await entityService.bulkRestore(ids);
        res.status(200).json({ message: 'Itens restaurados com sucesso' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const listTrash = async (req: any, res: Response) => {
    try {
        if (req.user.role === 'CLIENTE') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const trash = await entityService.listTrash();
        res.json(trash);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const permanentRemove = async (req: any, res: Response) => {
    try {
        if (req.user.role === 'CLIENTE') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        await entityService.permanentRemove(req.params.id);
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
```

#### Routes (`entityRoutes.ts`)
```typescript
import { Router } from 'express';
import * as entityController from '../controllers/entityController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticate);

// Specific paths first
router.get('/trash', entityController.listTrash);
router.post('/bulk-delete', entityController.bulkDelete);
router.post('/bulk-restore', entityController.bulkRestore);

// ID paths
router.patch('/:id/restore', entityController.restore);
router.delete('/:id/permanent', entityController.permanentRemove);
router.delete('/:id', entityController.remove);

export default router;
```

### Frontend

#### States
```tsx
type TabType = 'active' | 'trash';
const [tab, setTab] = useState<TabType>('active');
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [isBulkMode, setIsBulkMode] = useState(false);
```

#### Fetch Logic
```tsx
const fetchData = async () => {
    setIsLoading(true);
    try {
        const endpoint = tab === 'trash' ? '/entities/trash' : '/entities';
        const response = await api.get(endpoint);
        setData(response.data);
    } catch (err) {
        console.error('Erro ao buscar dados:', err);
    } finally {
        setIsLoading(false);
    }
};

useEffect(() => {
    fetchData();
}, [tab]); // Refetch quando mudar de aba
```

#### Bulk Actions
```tsx
const handleBulkDelete = async () => {
    const action = tab === 'trash' ? 'excluir PERMANENTEMENTE' : 'mover para a lixeira';
    if (!window.confirm(`ATENÇÃO: Deseja realmente ${action} os ${selectedIds.length} itens selecionados?`)) return;
    
    try {
        if (tab === 'trash') {
            // Permanent delete
            for (const id of selectedIds) {
                await api.delete(`/entities/${id}/permanent`);
            }
        } else {
            // Soft delete
            await api.post('/entities/bulk-delete', { ids: selectedIds });
        }
        fetchData();
        setSelectedIds([]);
        setIsBulkMode(false);
    } catch (err) {
        alert('Erro ao processar itens');
    }
};

const handleBulkRestore = async () => {
    if (!window.confirm(`Deseja restaurar ${selectedIds.length} itens da lixeira?`)) return;
    
    try {
        await api.post('/entities/bulk-restore', { ids: selectedIds });
        fetchData();
        setSelectedIds([]);
        setIsBulkMode(false);
    } catch (err) {
        alert('Erro ao restaurar itens');
    }
};
```

#### UI Tabs
```tsx
<div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
    <button
        onClick={() => { setTab('active'); setSelectedIds([]); }}
        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            tab === 'active' 
                ? 'bg-primary text-white shadow-lg' 
                : 'text-gray-400 hover:text-secondary'
        }`}
    >
        Ativos
    </button>
    <button
        onClick={() => { setTab('trash'); setSelectedIds([]); }}
        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            tab === 'trash' 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'text-gray-400 hover:text-secondary'
        }`}
    >
        <Trash2 size={14} /> Lixeira
    </button>
</div>
```

#### Bulk Actions Bar
```tsx
<AnimatePresence>
    {(selectedIds.length > 0 || isBulkMode) && (
        <motion.div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-8 py-5 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-10 min-w-[500px]">
            {/* ... select all, counter ... */}
            
            <div className="flex items-center gap-6">
                <button onClick={() => { setSelectedIds([]); setIsBulkMode(false); }}>
                    Cancelar
                </button>
                
                {tab === 'trash' ? (
                    <>
                        <button onClick={handleBulkRestore} className="bg-green-500">
                            <RefreshCcw size={18} /> Restaurar
                        </button>
                        <button onClick={handleBulkDelete} className="bg-red-500">
                            <Trash2 size={18} /> Excluir Permanente
                        </button>
                    </>
                ) : (
                    <button onClick={handleBulkDelete} className="bg-red-500">
                        <Trash2 size={18} /> Mover para Lixeira
                    </button>
                )}
            </div>
        </motion.div>
    )}
</AnimatePresence>
```

## Checklist de Implementação

Ao implementar sistema de lixeira em uma nova página/módulo:

### Backend
- [ ] Adicionar campo `deletedAt` no schema Prisma
- [ ] Implementar `remove()` (soft delete)
- [ ] Implementar `bulkDelete()` (soft delete em massa)
- [ ] Implementar `restore()` (restaurar individual)
- [ ] Implementar `bulkRestore()` (restaurar em massa)
- [ ] Implementar `listTrash()` (listar lixeira com filtro de 15 dias)
- [ ] Implementar `permanentRemove()` com proteção de tempo
- [ ] Adicionar controller endpoints
- [ ] Adicionar rotas
- [ ] Filtrar `deletedAt: null` em listagens normais

### Frontend
- [ ] Adicionar type `TabType` ('active' | 'trash')
- [ ] Adicionar states: `tab`, `selectedIds`, `isBulkMode`
- [ ] Implementar `fetchData()` com switch por tab
- [ ] useEffect com dependência `[tab]`
- [ ] Implementar `handleBulkDelete()` com lógica contextual
- [ ] Implementar `handleBulkRestore()`
- [ ] Adicionar tabs UI (Ativos / Lixeira)
- [ ] Adicionar bulk actions bar com botões condicionais
- [ ] Esconder botão "Novo" quando em trash
- [ ] Adicionar propriedade `deletedAt` na interface TypeScript

## Módulos com Sistema de Lixeira

### ✅ Implementado
- **Quotes** (`QuoteManager.tsx`)
  - Ativo/Histórico/Lixeira
  - Proteção de 90 dias para exclusão permanente
  - Restauração e reativação

- **Appointments** (`AgendaSPA.tsx`, `AgendaLOG.tsx`)
  - Ativo/Lixeira
  - Bulk restore
  - Filtro por categoria (SPA/LOGISTICA)

### 🔄 Recomendado Implementar
- **Customers** (`CustomerManager.tsx`)
- **Products** (`ProductManager.tsx`)
- **Services** (`ServiceManager.tsx`)
- **Invoices** (`BillingManager.tsx`)

### ❌ Não Aplicável
- **Users** (gestão de acesso, não deve ter lixeira)
- **Audit Logs** (registro histórico, nunca deletar)
- **StatusHistory** (registro histórico, nunca deletar)

## Cores e Temas por Módulo

| Módulo | Cor Primária | Cor Lixeira | Botão Criar |
|--------|--------------|-------------|-------------|
| Quotes | Azul (`bg-primary`) | Vermelho | Azul |
| Appointments SPA | Azul (`bg-primary`) | Vermelho | Azul |
| Appointments LOG | Laranja (`bg-orange-500`) | Vermelho | Laranja |
| Customers | Roxo (`bg-purple-600`) | Vermelho | Roxo |
| Products | Verde (`bg-green-600`) | Vermelho | Verde |

## Mensagens Padrão

### Confirmações
- **Soft Delete**: `"Deseja mover X itens para a lixeira?"`
- **Hard Delete**: `"ATENÇÃO: Deseja excluir PERMANENTEMENTE X itens? Esta ação não pode ser desfeita."`
- **Restore**: `"Deseja restaurar X itens da lixeira?"`

### Erros
- **Proteção de tempo**: `"Este item deve permanecer na lixeira por pelo menos X dias antes de ser excluído permanentemente."`
- **Não está na lixeira**: `"Este item não está na lixeira e não pode ser excluído permanentemente."`

## Auditoria

Toda ação de lixeira deve ser auditada:
```typescript
await auditService.log({
    userId: user.id,
    action: 'SOFT_DELETE' | 'RESTORE' | 'HARD_DELETE',
    entity: 'EntityType',
    entityId: id,
    details: { reason, timestamp, count }
});
```

## Testes

### Cenários Obrigatórios
1. Soft delete individual funciona
2. Soft delete em massa funciona
3. Restauração individual funciona
4. Restauração em massa funciona
5. Hard delete é bloqueado se item não está na lixeira
6. Hard delete é bloqueado se não passou tempo mínimo
7. Listagem de ativos não mostra deletados
8. Listagem de lixeira só mostra deletados recentes (15 dias)
9. Restauração preserva status original
10. Navegação entre tabs funciona corretamente

---

**Data de criação**: 2026-01-02  
**Última atualização**: 2026-01-02  
**Status**: PADRÃO OFICIAL 7PET
