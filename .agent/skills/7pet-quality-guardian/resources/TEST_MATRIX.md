# 7Pet Test Matrix (mínimo obrigatório)

## A) Estabilidade Mobile/PWA

1. Abrir app no mobile → nunca tela branca (sempre Loading/Error UI)
2. Navegar 3 telas seguidas (Dashboard → Agenda → Orçamentos)
3. Simular offline → banner e mensagem amigável
4. Voltar online → recovery e UI responde
5. Forçar chunk recovery (quando disponível) → não loop infinito

## B) Auth/Permissões

1. Login CLIENTE
2. Login STAFF
3. Login MASTER
4. Acesso a /staff/diagnostics: somente MASTER
5. Token expirado → 401 e redirect adequado (sem crash)

## C) Agenda/Calendário

1. Mobile compact view: header fixo + lista rolável
2. Seletor de visão: dia/semana/mês/kanban (web) (se aplicável)
3. Cancelar exige justificativa
4. No-show: após 2 → bloqueio + exige pré-pagamento

## D) Orçamentos

1. Fluxo de status:
   solicitação → em produção → enviado → recalculado → aprovado/reprovado → agendar
2. Orçamento + agendamento criam registros consistentes
3. Operador confirma horários (cliente sugere)

## E) Transporte (regressões)

1. Sem Maps: fallback e mensagem amigável, sem travar UI
2. Com Maps: cálculo retorna km/min e salva
3. Socket não usa userId em query string

## F) Socket.IO (mobile)

1. Conecta pós-login
2. Pausa no background e retoma ao voltar
3. Circuit breaker: evita spam em falha

## G) Perf mínimo

1. Lighthouse Mobile não piora mais de 5 pontos vs baseline
2. Bundle size não explode (comparar dist)
