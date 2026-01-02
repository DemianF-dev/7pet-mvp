# Sistema de Resgate de Orçamentos

## Visão Geral
O sistema 7Pet implementa um mecanismo robusto de proteção e recuperação de orçamentos, permitindo que operadores resgatem orçamentos do histórico ou da lixeira.

## Funcionalidades

### 1. **Resgate do Histórico**
Orçamentos com status `ENCERRADO` podem ser resgatados de duas formas:

#### Opção A: Duplicar
- Cria uma **cópia** do orçamento original
- Novo orçamento criado com status `SOLICITADO`
- Orçamento original permanece no histórico
- Ideal para aproveitar dados de orçamentos antigos

#### Opção B: Reativar
- **Move** o orçamento de volta para a lista de ativos
- Status alterado de `ENCERRADO` para `SOLICITADO`
- Orçamento desaparece do histórico
- Ideal para corrigir encerramentos acidentais

**Como usar:**
1. Acesse a aba "Histórico" no gerenciador de orçamentos
2. Localize o orçamento desejado
3. Clique em "Reativar" (botão verde) ou "Duplicar" (ícone azul)
4. Confirme a ação

### 2. **Restauração da Lixeira**
Orçamentos deletados (soft delete) podem ser restaurados:

**Como funciona:**
1. Acesse a aba "Lixeira"
2. Localize o orçamento
3. Clique no ícone de restauração (🔄)
4. Orçamento volta para a lista de ativos

### 3. **Proteção contra Exclusão Permanente**
O sistema implementa uma proteção de **90 dias** antes da exclusão permanente:

**Regras:**
- Orçamentos na lixeira **não podem** ser excluídos permanentemente antes de 90 dias
- Tentativas de exclusão prematura exibem mensagem com dias restantes
- Após 90 dias, a exclusão permanente é liberada
- Exclusão permanente é **irreversível** e remove todos os dados

**Benefícios:**
- ✅ Proteção contra exclusões acidentais
- ✅ Janela de recuperação ampla (3 meses)
- ✅ Conformidade com boas práticas de retenção de dados
- ✅ Auditoria completa de exclusões permanentes

## Fluxo de Estados

```
[ATIVO] --delete--> [LIXEIRA] --restore--> [ATIVO]
                         |
                    (após 90 dias)
                         |
                   [EXCLUSÃO PERMANENTE]

[HISTÓRICO] --reativar--> [ATIVO]
            --duplicar--> [NOVO ATIVO]
```

## Endpoints Backend

### Reativar Orçamento
```http
PATCH /quotes/:id
Body: { "status": "SOLICITADO" }
```

### Duplicar Orçamento
```http
POST /quotes/:id/duplicate
```

### Restaurar da Lixeira
```http
POST /quotes/:id/restore
```

### Exclusão Permanente (com proteção de 90 dias)
```http
DELETE /quotes/:id/permanent
```
**Retorno de erro se < 90 dias:**
```json
{
  "error": "Proteção de dados ativa: Este orçamento só poderá ser excluído permanentemente após 90 dias na lixeira. Faltam X dias.",
  "daysRemaining": 45
}
```

## Auditoria

Todas as ações de resgate são registradas no sistema de auditoria:

- `UPDATE_STATUS`: Reativação de orçamento
- `CREATE`: Duplicação de orçamento
- `RESTORE`: Restauração da lixeira
- `DELETE_PERMANENT`: Exclusão permanente (após 90 dias)

## Casos de Uso

### Caso 1: Cliente mudou de ideia após encerramento
**Situação:** Orçamento foi encerrado porque cliente desistiu, mas voltou interessado.
**Solução:** Reativar o orçamento do histórico.

### Caso 2: Orçamento antigo como base para novo
**Situação:** Cliente regular quer serviço similar ao do ano passado.
**Solução:** Duplicar orçamento do histórico.

### Caso 3: Exclusão acidental
**Situação:** Operador moveu orçamento para lixeira por engano.
**Solução:** Restaurar da lixeira imediatamente.

### Caso 4: Limpeza de dados antigos
**Situação:** Orçamentos de clientes inativos há mais de 3 meses.
**Solução:** Aguardar 90 dias e realizar exclusão permanente.

## Boas Práticas

1. **Sempre revisar antes de reativar**: Confirme que o orçamento está correto e atualizado
2. **Preferir duplicar para referências**: Se o orçamento é muito antigo, duplicar é mais seguro
3. **Não excluir permanentemente prematuramente**: Deixe a proteção de 90 dias fazer seu trabalho
4. **Documentar reativações importantes**: Use o campo de observações para registrar o motivo

## Configuração Técnica

### Proteção de 90 dias (Backend)
```typescript
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

if (quote.deletedAt > ninetyDaysAgo) {
    const daysRemaining = Math.ceil(
        (quote.deletedAt.getTime() - ninetyDaysAgo.getTime()) / (1000 * 60 * 60 * 24)
    );
    return res.status(400).json({ 
        error: `Proteção ativa. Faltam ${daysRemaining} dias.`,
        daysRemaining 
    });
}
```

### Interface de Resgate (Frontend)
```tsx
// Histórico - Botão Reativar
<button onClick={async () => {
    if (confirm('Reativar este orçamento?')) {
        await api.patch(`/quotes/${id}`, { status: 'SOLICITADO' });
        fetchQuotes();
    }
}}>
    <RefreshCcw /> Reativar
</button>
```

## Manutenção

- **Revisão trimestral**: Verificar orçamentos na lixeira há mais de 90 dias
- **Limpeza automática**: Considerar implementar job para exclusão automática após 180 dias (futura melhoria)
- **Monitoramento de auditoria**: Revisar logs de exclusões permanentes mensalmente
