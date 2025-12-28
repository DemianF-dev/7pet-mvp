---
description: Como rodar o sistema 7Pet localmente e preparar para teste
---

# 🚀 Guia de Configuração e Teste - 7Pet

Siga estes passos exatos para colocar o MVP para rodar na sua máquina e entender como levá-lo para produção.

## 1. Pré-Requisitos
Certifique-se de ter instalado:
- **Node.js** (v18 ou superior)
- **PostgreSQL** ou **Docker** (recomendado para o banco)
- **Editor**: VS Code recomendado

---

## 2. Configurando o Banco de Dados (Via Docker - Mais fácil)
Se você tem Docker instalado, basta rodar:
```bash
docker-compose up -d
```
Isso criará o banco PostgreSQL já configurado para o sistema.

Se preferir manual:
1. No terminal, vá para a pasta do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Edite o arquivo `.env` para apontar para o seu banco:
   `DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/NOME_BANCO?schema=public"`
4. Rode os comandos do Prisma:
   ```bash
   # Cria as tabelas
   npx prisma migrate dev --name init
   
   # Popula os serviços iniciais (Banho, Tosa, etc)
   npx prisma db seed
   ```

---

## 3. Rodando o Backend (API)
Ainda na pasta `backend`:
```bash
# Inicia em modo de desenvolvimento
npm run dev
```
> O servidor abrirá em `http://localhost:3001`. Você pode testar acessando `http://localhost:3001/health`.

---

## 4. Rodando o Frontend (Web App)
Abra um **novo terminal** na pasta raiz do projeto.

1. Vá para a pasta do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
> O app abrirá em `http://localhost:5173`. Clique no link no terminal.

---

## 5. Como Testar as Funcionalidades
1. **Landing Page**: Escolha entre "Área do Cliente" ou "Acesso Colaborador".
2. **Login Cliente**: Clique em entrar (é possível usar dados fakes agora já que o auth está em modo MVP).
3. **Dashboards**: Explore os cards premium.
4. **API**: Use o Postman ou Insomnia para testar os endpoints documentados no README.

---

## 6. Colocando "No Ar" (Deploy)
Para testes externos (enviar link para alguém):

### Opção A: Frontend (Vercel)
1. Conecte seu GitHub à **Vercel**.
2. Selecione a pasta `frontend`.
3. Configure o comando de build como `npm run build`.

### Opção B: Backend + Banco (Railway.app ou Render)
1. Crie um projeto no **Railway**.
2. Adicione um database PostgreSQL.
3. Suba o código da pasta `backend`.
4. Adicione as variáveis de ambiente (DATABASE_URL, JWT_SECRET) no painel do Railway.
