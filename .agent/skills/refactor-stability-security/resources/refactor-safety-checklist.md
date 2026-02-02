# Refactor Safety Checklist

Antes de realizar o merge ou deploy de uma refatoração profunda, garanta que:

1. **Persistência**: O schema do Prisma foi verificado? Alguma migration é necessária?
2. **Backward Compatibility**: A API antiga ainda funciona ou todos os clientes (frontend) foram atualizados?
3. **Environment**: Novas variáveis em `.env.example` foram adicionadas?
4. **Error Boundaries**: O frontend falha graciosamente se a nova lógica do backend retornar um erro inesperado?
5. **Logs**: O nível de log está correto (Info para produção, Debug para dev)?
6. **No Any**: O uso de `any` no TypeScript foi reduzido ao mínimo?
