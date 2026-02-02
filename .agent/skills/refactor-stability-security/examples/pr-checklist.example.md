# PR Checklist: Refactor & Stability

## Segurança

- [ ] Não há secrets em código.
- [ ] Inputs são validados com Zod.
- [ ] Erros não expõem stacktraces para o usuário.

## Estabilidade

- [ ] Existem fallbacks de loading no frontend.
- [ ] Loops com Prisma foram revisados para evitar N+1.
- [ ] `npm run build` passou sem avisos críticos.

## Qualidade

- [ ] Lógica complexa foi movida para Services.
- [ ] Types foram atualizados e não há uso de `any` injustificado.
- [ ] Comentários explicam o "porquê", não o "quê".
