
# 🚨 Correção Crítica: Banco de Dados na Railway

Identificamos a causa exata do erro de login ("Tenant or user not found").

## 🛑 O Problema

O backend na Railway **está tentando conectar** ao Supabase, mas o Supabase está rejeitando a conexão com o erro falha de tenant. Isso acontece por dois motivos principais:

1. **Projeto Pausado:** O banco de dados no Supabase foi "pausado" por inatividade.
2. **URL de Conexão Incorreta:** A `DATABASE_URL` configurada na Railway está apontando para o *pooler* de transações incorreto ou está faltando parâmetros.

## ✅ Como Resolver

### 1. Verifique se o Supabase está Ativo

1. Acesse o painel do Supabase.
2. Se o projeto estiver pausado, clique em **"Restore"** e aguarde ele voltar.

### 2. Corrija a DATABASE_URL na Railway

1. Acesse o painel da Railway -> Seu Projeto -> Backend -> **Variables**.
2. Verifique a variável `DATABASE_URL`.
3. Ela DEVE seguir este formato para conexão direta (recomendado para Prisma):

   ```
   postgresql://postgres:[SUA-SENHA]@db.[REF-DO-PROJETO].supabase.co:5432/postgres
   ```

   **Importante:** Use a porta `5432` (Session Mode) para garantir compatibilidade total com o Prisma inicialmente.

4. Se você estiver usando a porta `6543` (Transaction Mode), adicione `?pgbouncer=true` ao final:

   ```
   postgresql://postgres.[REF-DO-PROJETO]:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### 3. Teste a Conexão (Ferramenta de Diagnóstico)

Deixei uma rota de emergência ativa para você testar sem precisar fazer login:

1. Abra seu navegador ou terminal.
2. Acesse:

   ```
   https://7pet-mvp-production.up.railway.app/emergency/users?secret=7pet-rescue
   ```

3. Se aparecer `{"status": "DB Connection OK" ...}`, o banco reconectou! 🎉
4. Se der erro, ele vai mostrar o motivo exato.

### 4. Crie o Usuário Master (Se necessário)

Se o banco reconectar mas você não conseguir logar, use este comando para criar/resetar o Master:

```bash
curl -X POST -H "Content-Type: application/json" -d "{\"email\":\"admin@7pet.com\", \"password\":\"senha123\"}" "https://7pet-mvp-production.up.railway.app/emergency/create-master?secret=7pet-rescue"
```

## 🧹 Limpeza

Após resolver, me avise para eu remover as rotas de emergência (`/emergency/*`) do código, pois elas são inseguras para deixar em produção permanentemente.
