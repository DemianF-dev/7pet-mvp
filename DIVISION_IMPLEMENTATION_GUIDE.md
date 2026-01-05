# Guia de Implementação - Sistema de Divisões

## 📋 Resumo das Mudanças

O sistema foi reconfigurado para usar **Divisões/Departamentos** ao invés de cargos como base hierárquica.

### Divisões Disponíveis

1. **CLIENTE** - Clientes do sistema
2. **SPA** - Verde pastel (#BBF7D0)
3. **COMERCIAL** (Atendimento Comercial) - Azul pastel (#BFDBFE)
4. **LOGISTICA** - Laranja pastel (#FED7AA)
5. **GERENCIA** - Amarelo pastel (#FEF08A)
6. **DIRETORIA** - Marrom pastel (#D9C7B8)
7. **ADMIN** (Diretoria/ADMIN) - Marrom pastel escuro (#C4B5A0)

## 🔧 Passos para Aplicar as Mudanças

### 1. Aplicar Migration no Banco de Dados

Execute o arquivo SQL manualmente no Supabase:

```bash
# Abra o SQL Editor no Supabase e execute o arquivo:
# add_division_migration.sql
```

OU use a interface do Supabase:

1. Acesse o SQL Editor
2. Cole o conteúdo do arquivo `add_division_migration.sql`
3. Execute

### 2. Regenerar Prisma Client

```bash
cd backend
npx prisma generate
```

### 3. Atualizar AuthStore no Frontend

Arquivo: `frontend/src/store/authStore.ts`

Adicione ao interface User:

```typescript
division?: string;  // Adicionar esta linha
role?: string;      // Tornar opcional
```

### 4. Atualizar UserManager

Arquivo: `frontend/src/pages/staff/UserManager.tsx`

- Trocar referências de "Cargo" para "Divisão"
- Usar as cores das divisões
- Permitir apenas DIRETORIA/ADMIN editar o campo "role" (cargo)
- Usar DIVISION_LABELS, DIVISION_COLORS do arquivo constants/divisions.ts

### 5. Atualizar Componentes que Usam Role

Arquivos a atualizar para usar `division`:

- `StaffSidebar.tsx` - Verificar permissões por divisão
- `authStore.ts` - Adicionar campo division
- Todos os componentes que filtram por role

### 6. Testar Permissões

Após aplicar as mudanças, testar:

- ✅ Login funciona
- ✅ Permissões corretas por divisão
- ✅ Cores aparecem corretamente
- ✅ UserManager mostra divisões
- ✅ Apenas Diretoria pode editar cargo

## 📝 Estrutura de Dados

### Antes

```typescript
{
  role: "OPERACIONAL"  // Determinava permissões
}
```

### Depois

```typescript
{
  division: "SPA",           // Determina permissões e cor
  role: "Tosador Sênior"     // Cargo opcional, apenas informativo
}
```

## 🎨 Uso das Cores

```typescript
import { getDivisionColor, getDivisionLabel, getDivisionBgClass } from '@/constants/divisions';

const color = getDivisionColor(user.division);        // #BBF7D0
const label = getDivisionLabel(user.division);        // "SPA"
const bgClass = getDivisionBgClass(user.division);    // "bg-green-200"
```

## ⚠️ Compatibilidade Retroativa

O sistema mantém compatibilidade com dados antigos:

- Se `division` não existir, usa `role` como fallback
- Middleware de auth aceita ambos os campos
- Migration copia valores de `role` para `division` automaticamente

## 🔐 Controle de Acesso

### Hierarquia

0. CLIENTE
1. SPA, COMERCIAL, LOGISTICA
2. GERENCIA
3. DIRETORIA
4. ADMIN

### Permissões Especiais

- Definir cargo: Apenas DIRETORIA e ADMIN
- Editar permissões individuais: Manualmente no perfil do usuário
- Gerenciar usuários: DIRETORIA e ADMIN

## 📦 Arquivos Criados/Modificados

### Criados

- ✅ `backend/add_division_migration.sql`
- ✅ `backend/src/constants/divisions.ts`
- ✅ `frontend/src/constants/divisions.ts`

### Modificados

- ✅ `backend/prisma/schema.prisma`
- ✅ `backend/src/middlewares/authMiddleware.ts`

### A Modificar (Próximos Passos)

- ⏳ `frontend/src/store/authStore.ts`
- ⏳ `frontend/src/pages/staff/UserManager.tsx`
- ⏳ `frontend/src/components/StaffSidebar.tsx`
- ⏳ Outros componentes que usam role

## 🚀 Próximos Passos

1. Aplicar a migration SQL no banco
2. Regenerar Prisma Client
3. Atualizar o frontend para usar divisions
4. Testar todas as funcionalidades
5. Ajustar permissões conforme necessário
