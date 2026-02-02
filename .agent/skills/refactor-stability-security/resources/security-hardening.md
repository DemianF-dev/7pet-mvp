# Security Hardening - my7pet

Checklist de reforço de segurança para ser aplicado durante refatorações.

## Camada de Rede (Backend)

- [ ] **Helmet**: Garantir que `helmet()` está ativo no `index.ts`.
- [ ] **CORS**: Limitar domínios permitidos em produção.
- [ ] **Rate Limit**: Ajustar threshold para rotas de `/auth` e `/api/chat`.

## Camada de Dados

- [ ] **Sanitização**: Usar Zod para filtrar campos extras em `req.body`.
- [ ] **Prisma RLS**: Validar se Row Level Security (se usado no DB) condiz com os IDs de posse.

## Camada de Autenticação

- [ ] **JWT**: Usar algoritmo `HS256` ou superior. Garantir `exp` razoável (ex: 24h).
- [ ] **Bcrypt**: Garantir salt rounds >= 10.

## Infra & Logs

- [ ] **Headers**: Esconder `X-Powered-By`.
- [ ] **Logs**: Sanitizar chaves como `password`, `token`, `secret`.
