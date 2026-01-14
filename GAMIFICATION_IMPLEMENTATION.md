# Implementação do Sistema de Gamificação (Pausa Menu)

## Visão Geral

Foi implementada uma funcionalidade de gamificação que permite habilitar ou desabilitar o menu "Pausa" para usuários específicos e selecionar quais jogos estão disponíveis para eles.
Por padrão, o menu Pausa e os jogos vêm **desabilitados**.
A configuração desses acessos é restrita ao usuário desenvolvedor (`oidemianf@gmail.com`).

## Alterações Realizadas

### 1. Banco de Dados e Backend

- **Schema Prisma (`User`)**: Adicionados os campos:
  - `pauseMenuEnabled`: Boolean (Default: false)
  - `allowedGames`: Json (Default: [])
- **Controller (`managementController.ts`)**: Adicionada lógica para permitir atualização desses campos apenas pelo e-mail de desenvolvedor.

### 2. Frontend - Lógica de Acesso

- **Store (`authStore.ts`)**: Atualizada interface `User` para incluir os novos campos.
- **Sidebar (`StaffSidebar.tsx`)**: O item de menu "Pausa" agora só é renderizado se `user.pauseMenuEnabled` for verdadeiro.
- **Página Pausa (`PausaPage.tsx`)**:
  - Adicionado redirecionamento de segurança: Se o usuário tentar acessar `/pausa` diretamente sem permissão, é redirecionado para o dashboard.
  - Filtro de Jogos: A lista de jogos exibida é filtrada baseada no array `allowedGames` do usuário.

### 3. Frontend - Interface de Configuração

- **Gestão de Usuários (`UserManager.tsx`)**:
  - Adicionada seção "Gamification & Privilégios (Dev Only)" no modal de edição de usuário.
  - Esta seção permite:
    - Habilitar o toggle "Menu PAUSA".
    - Selecionar jogos específicos via checkboxes (Paciência Pet, Zen Espuma, Desenrosca a Coleira).
  - Esta seção é visível **apenas** para `oidemianf@gmail.com`.

## Como Testar

1. Faça login como `oidemianf@gmail.com`.
2. Vá em **Gestão > Usuários**.
3. Edite um usuário (ou crie um novo).
4. Role até o final do modal para ver a seção de Gamification.
5. Habilite o menu e selecione alguns jogos. Salve.
6. Faça login com o usuário configurado.
7. Verifique se o menu "Pausa" aparece na sidebar.
8. Acesse o menu e verifique se apenas os jogos selecionados aparecem.
9. Tente acessar diretamente a rota de um jogo não permitido (deve-se notar que o filtro é na listagem, a proteção de rota individual pode ser adicionada futuramente se necessário strict security nível API).
