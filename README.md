# 7Pet - Pet Shop Management MVP

Sistema moderno para gestão de pet shops, focado em simplicidade e performance.

## Stacks
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Banco**: PostgreSQL (configurável no .env)

## Como rodar localmente

### 1. Requisitos
- Node.js v18+
- PostgreSQL rodando

### 2. Configuração do Backend
1. Entre na pasta `backend`: `cd backend`
2. Instale as dependências: `npm install`
3. Configure o `.env` (duplique o exemplo se necessário)
4. Rode as migrações: `npx prisma migrate dev --name init`
5. (Opcional) Popule o banco: `npx prisma db seed`
6. Inicie o servidor: `npm run dev` (ou `npx ts-node src/index.ts`)

### 3. Configuração do Frontend
1. Entre na pasta `frontend`: `cd frontend`
2. Instale as dependências: `npm install`
3. Inicie o app: `npm run dev`

## Estrutura de Rotas
- Cliente: `/`, `/client`, `/client/login`, `/client/dashboard`
- Colaborador: `/staff/login`, `/staff/dashboard`

## Funcionalidades Implementadas
- [x] Login/Cadastro de Cliente
- [x] Login de Colaborador
- [x] Dashboard de Cliente (Premium UI)
- [x] Dashboard de Colaborador (Premium UI)
- [x] API de CRUD para Clientes, Pets e Agendamentos
- [x] API de Orçamentos e Faturas
- [x] Registro de Pagamentos
