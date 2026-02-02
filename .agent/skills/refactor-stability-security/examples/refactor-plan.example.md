# Exemplo de Plano de Refatoração

**Tarefa**: Extrair lógica de agendamento do `AppointmentController` para `AppointmentService`.

## 1. Motivação

O controller atual possui 500 linhas e mistura validação, lógica de banco e envio de emails. Isso dificulta a criação de testes unitários.

## 2. Impacto

- Afeta rotas: `POST /appointments`, `PUT /appointments/:id`.
- Sem mudanças no contrato da API.

## 3. Passos

1. Criar `backend/src/services/AppointmentService.ts`.
2. Mover lógica de verificação de disponibilidade.
3. Mover lógica de cálculo de preço.
4. Injetar o service no controller.
5. Rodar `npm run test` no backend.

## 4. Rollback Plan

Em caso de falha no build, reverter commit via `git revert`.
