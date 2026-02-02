# Política de Logging - my7pet

Para garantir a segurança e observabilidade do sistema.

## Níveis de Log

- **FATAL**: Erros que impedem o sistema de iniciar.
- **ERROR**: Erros em requisições ou processos de fundo (ex: falha no banco).
- **WARN**: Problemas potenciais (ex: retry de conexão).
- **INFO**: Eventos significativos (ex: Servidor iniciado, Usuário logado - sem PII).
- **DEBUG**: Detalhes técnicos para desenvolvimento.

## Regras de Ouro

1. **NUNCA** inclua: Senhas, CVVs, Tokens JWT completos, ou emails (PII) em strings de log.
2. **CONTEXTO**: Sempre inclua um ID de correlação ou o ID da entidade (Ex: `orderId`) para rastrear o erro.
3. **DESTINO**: No ambiente local, os logs podem ir para `backend/server.log`. Em produção, devem ir para o STDOUT para coleta do provedor cloud (Vercel/Railway).
