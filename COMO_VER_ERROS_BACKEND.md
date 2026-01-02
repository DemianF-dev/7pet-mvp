# Como Ver os Logs de Erro do Backend

Para ver os erros detalhados do backend, siga estes passos:

## Opção 1: No Terminal do VSCode

1. No VSCode, procure pelo painel de **TERMINAL** na parte inferior da tela
2. Você deve ver várias abas de terminais abertos
3. Clique na aba que diz algo como: **"cd backend npm install npm run dev"** ou **"backend"**
4. Nesse terminal, role para cima para ver as mensagens de log
5. Procure por linhas que começam com:
   - `Updating customer with data:` ← mostra os dados recebidos
   - `Validation errors:` ← mostra os erros de validação específicos
   - `Erro ao atualizar cliente:` ← mostra erros gerais

## Opção 2: Teste via Console do Navegador

1. Abra o DevTools do navegador (F12)
2. Vá na aba **Console**
3. Tente salvar o cliente novamente
4. Procure por erros em vermelho
5. Copie e cole aqui a mensagem de erro completa

## Opção 3: Verifique a Resposta da API

1. Abra o DevTools (F12)
2. Vá na aba **Network**
3. Tente salvar o cliente
4. Procure pela requisição que falhou (geralmente em vermelho)
5. Clique nela
6. Vá na aba **Response**
7. Copie e cole aqui o conteúdo JSON da resposta

## O que procurar:

A mensagem de erro agora mostra detalhes assim:

```json
{
  "error": "Dados inválidos",
  "details": [
    {
      "field": "email",
      "message": "Email inválido",
      "received": "texto-errado"
    }
  ]
}
```

Se você conseguir me mostrar essa parte `details`, posso corrigir o problema específico!
