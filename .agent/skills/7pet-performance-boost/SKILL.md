---
name: 7pet-performance-boost
description: Focada em escalabilidade extrema, otimização de consultas ao banco de dados e refinamento da arquitetura de backend para suportar o crescimento do volume de transações do 7Pet.
---

# 7Pet Performance Boost Skill

A skill de **Performance Boost** é responsável por garantir que o 7Pet continue rápido e responsivo, mesmo com milhares de registros de pets, agendamentos e transações de faturamento.

## 1. Foco de Otimização

- **N+1 Query Detection**: Identifica loops que fazem chamadas excessivas ao banco de dados via Prisma e os substitui por consultas otimizadas com `select` e `where`.
- **Frontend Hydration**: Melhora o carregamento de páginas pesadas (como o Dashborad de Agendamentos) usando estratégias de memoização e estados otimizados (Zustand).
- **Backend Refactoring**: Prepara o terreno para a "Billing V2", garantindo que novos módulos de faturamento não degradem a performance geral.

## 2. Estratégias Modernas

- **Prisma Middlewares/Extensions**: Para logging de tempo de execução e otimização automática de queries lentas.
- **Cache Layer Ready**: Prepara a arquitetura para futura integração com Redis ou sistemas de cache in-memory.
- **Payload Management**: Reduz o tamanho da transferência de dados entre backend e frontend (evitando enviar objetos JSON gigantes desnecessários).

## 3. Checklist de Performance

- [ ] Conferir se todos os `findMany` possuem paginação ou limite.
- [ ] Validar o uso de `React.memo` em componentes de listas longas no Staff Portal.
- [ ] Verificar o tempo de resposta médio dos endpoints de faturamento.
- [ ] Otimizar imagens e assets via compressão automática.

## 4. Como Executar

O assistente deve realizar periodicamente:

- "Analise as queries Prisma do `authService.ts` e procure gargalos."
- "Refatore o componente `ChatPage.tsx` para evitar re-renders desnecessários."
- "Proponha uma estrutura de cache para o catálogo de produtos."
